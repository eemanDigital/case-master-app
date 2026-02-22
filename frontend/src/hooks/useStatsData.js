// hooks/useStatsData.js
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMatterStats } from "../redux/features/matter/matterSlice";
import { getUserStatistics } from "../redux/features/auth/authSlice";

export const useStatsData = () => {
  const dispatch = useDispatch();

  const { stats: matterStats, isLoading: matterLoading } = useSelector(
    (state) => state.matter,
  );

  const { userStatistics: userStats, isLoading: userStatsLoading } =
    useSelector((state) => state.auth);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        await Promise.all([
          dispatch(getMatterStats()).unwrap(),
          dispatch(getUserStatistics()).unwrap(),
        ]);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    fetchStats();
  }, [dispatch]);

  // Memoized computed values
  const stats = useMemo(() => {
    const userData = userStats?.statistics || {};
    const matterData = matterStats || {};

    return {
      // User stats
      totalUsers: userData.total || 0,
      staffCount: userData.roles?.staff || 0,
      lawyerCount: userData.roles?.lawyer || 0,
      clientCount: userData.roles?.client || 0,
      adminCount: userData.roles?.admin || 0,
      verifiedUsers: userData.verified || 0,
      activeUsers: userData.active?.active || 0,

      // Matter stats
      totalMatters: matterData.totalMatters || 0,
      activeMatters: matterData.activeMatters || 0,
      pendingMatters: matterData.pendingMatters || 0,
      completedMatters: matterData.completedMatters || 0,
      closedMatters: matterData.closedMatters || 0,
      highPriorityMatters: matterData.highPriorityMatters || 0,
      urgentPriorityMatters: matterData.urgentPriorityMatters || 0,
      averageAgeDays: matterData.averageAgeDays || 0,
      myMatters: matterData.myMatters || 0,

      // Chart data
      mattersByType: matterData.byType || [],
      mattersByStatus: matterData.byStatus || [],
      mattersByPriority: matterData.byPriority || [],
      recentActivity: matterData.recentActivity || [],

      // User breakdown
      userBreakdown: userData.breakdown || {},
      roles: userData.roles || {},
    };
  }, [matterStats, userStats]);

  const loading = matterLoading || userStatsLoading;

  return {
    stats,
    loading,
    matterStats,
    userStats,
  };
};
