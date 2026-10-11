import mongoose from "mongoose";
import Lead, { type ILead } from "../models/lead.model.js";
import Customer, { type ICustomer } from "../models/customer.model.js";
import Deal, { type IDeal } from "../models/deal.model.js";
import Activity, { type IActivity } from "../models/activity.model.js";
import User from "../models/user.model.js";
import type { AuthenticatedUser } from "../types/auth.js";
import { DEAL_STAGES } from "../constants/crm.js";

export async function getDashboardMetrics(user: AuthenticatedUser) {
  const isExecutive = user.role === "sales_executive";
  const userObjectId = new mongoose.Types.ObjectId(user.id);

  const leadFilter: Record<string, any> = isExecutive
    ? { assignedSalesExecutive: userObjectId }
    : {};
  const customerFilter: Record<string, any> = isExecutive
    ? { assignedSalesExecutive: userObjectId }
    : {};
  const dealFilter: Record<string, any> = isExecutive
    ? { assignedEmployee: userObjectId }
    : {};
  const activityFilter: Record<string, any> = isExecutive
    ? { assignedUser: userObjectId }
    : {};

  const now = new Date();

  const [
    totalLeads,
    newLeads,
    qualifiedLeads,
    convertedLeads,
    totalCustomers,
    totalDeals,
    wonDealsAgg,
    lostDealsCount,
    openDealsAgg,
    pendingActivities,
    overdueActivities,
  ] = await Promise.all([
    Lead.countDocuments(leadFilter),
    Lead.countDocuments({ ...leadFilter, status: "new" }),
    Lead.countDocuments({ ...leadFilter, status: "qualified" }),
    Lead.countDocuments({ ...leadFilter, status: "converted" }),
    Customer.countDocuments(customerFilter),
    Deal.countDocuments(dealFilter),
    // Won deals: count and revenue
    Deal.aggregate([
      { $match: { ...dealFilter, currentStage: "won" } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalRevenue: { $sum: "$dealValue" },
        },
      },
    ]),
    Deal.countDocuments({ ...dealFilter, currentStage: "lost" }),
    // Open deals: count and expected revenue
    Deal.aggregate([
      {
        $match: {
          ...dealFilter,
          currentStage: { $nin: ["won", "lost"] },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          expectedRevenue: { $sum: "$expectedRevenue" },
        },
      },
    ]),
    // Pending activities
    Activity.countDocuments({
      ...activityFilter,
      status: "pending",
      dueDate: { $gte: now },
    }),
    // Overdue activities
    Activity.countDocuments({
      ...activityFilter,
      status: { $ne: "completed" },
      dueDate: { $lt: now },
    }),
  ]);

  const wonDealsCount = wonDealsAgg[0]?.count || 0;
  const totalRevenue = wonDealsAgg[0]?.totalRevenue || 0;
  const openDealsCount = openDealsAgg[0]?.count || 0;
  const expectedRevenue = openDealsAgg[0]?.expectedRevenue || 0;

  const conversionRate =
    totalLeads > 0
      ? Number(((convertedLeads / totalLeads) * 100).toFixed(2))
      : 0;

  return {
    leads: {
      total: totalLeads,
      new: newLeads,
      qualified: qualifiedLeads,
      converted: convertedLeads,
      conversionRatePercentage: conversionRate,
    },
    customers: {
      total: totalCustomers,
    },
    deals: {
      total: totalDeals,
      open: openDealsCount,
      won: wonDealsCount,
      lost: lostDealsCount,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      expectedRevenue: Number(expectedRevenue.toFixed(2)),
    },
    activities: {
      pending: pendingActivities,
      overdue: overdueActivities,
    },
  };
}

export async function getSalesPipeline(user: AuthenticatedUser) {
  const isExecutive = user.role === "sales_executive";
  const userObjectId = new mongoose.Types.ObjectId(user.id);

  const matchStage = isExecutive
    ? { assignedEmployee: userObjectId }
    : {};

  const pipelineAgg = await Deal.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$currentStage",
        dealCount: { $sum: 1 },
        totalValue: { $sum: "$dealValue" },
        expectedRevenue: { $sum: "$expectedRevenue" },
      },
    },
  ]);

  const stageMap = new Map<
    string,
    { dealCount: number; totalValue: number; expectedRevenue: number }
  >();

  for (const item of pipelineAgg) {
    stageMap.set(item._id, {
      dealCount: item.dealCount,
      totalValue: Number(item.totalValue.toFixed(2)),
      expectedRevenue: Number(item.expectedRevenue.toFixed(2)),
    });
  }

  const pipeline = DEAL_STAGES.map((stage) => {
    const data = stageMap.get(stage) || {
      dealCount: 0,
      totalValue: 0,
      expectedRevenue: 0,
    };
    return {
      stage,
      deals: data.dealCount,
      totalValue: data.totalValue,
      expectedRevenue: data.expectedRevenue,
    };
  });

  return {
    pipeline,
    summary: {
      totalDeals: pipeline.reduce((acc, curr) => acc + curr.deals, 0),
      totalPipelineValue: Number(
        pipeline.reduce((acc, curr) => acc + curr.totalValue, 0).toFixed(2)
      ),
    },
  };
}

export async function getTeamPerformance() {
  const users = await User.find({
    role: "sales_executive",
  })
    .select("name email isActive")
    .lean();

  const performanceList = await Promise.all(
    users.map(async (u) => {
      const uId = u._id;

      const [leadsCount, convertedLeadsCount, dealsAgg, overdueActCount] =
        await Promise.all([
          Lead.countDocuments({ assignedSalesExecutive: uId }),
          Lead.countDocuments({
            assignedSalesExecutive: uId,
            status: "converted",
          }),
          Deal.aggregate([
            { $match: { assignedEmployee: uId } },
            {
              $group: {
                _id: "$currentStage",
                count: { $sum: 1 },
                revenue: { $sum: "$dealValue" },
              },
            },
          ]),
          Activity.countDocuments({
            assignedUser: uId,
            status: { $ne: "completed" },
            dueDate: { $lt: new Date() },
          }),
        ]);

      let wonDeals = 0;
      let wonRevenue = 0;
      let totalDeals = 0;

      for (const d of dealsAgg) {
        totalDeals += d.count;
        if (d._id === "won") {
          wonDeals += d.count;
          wonRevenue += d.revenue;
        }
      }

      const conversionRate =
        leadsCount > 0
          ? Number(((convertedLeadsCount / leadsCount) * 100).toFixed(2))
          : 0;

      return {
        user: {
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          isActive: u.isActive,
        },
        metrics: {
          totalLeads: leadsCount,
          convertedLeads: convertedLeadsCount,
          conversionRatePercentage: conversionRate,
          totalDeals,
          wonDeals,
          wonRevenue: Number(wonRevenue.toFixed(2)),
          overdueActivities: overdueActCount,
        },
      };
    })
  );

  return performanceList;
}
