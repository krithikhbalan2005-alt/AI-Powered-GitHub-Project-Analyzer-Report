import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../services/firebase/firebase';

/**
 * Fetch platform-wide analytics
 */
export async function getAdminAnalytics(_req: AuthenticatedRequest, res: Response) {
  try {
    // 1. Get total users count
    const usersSnap = await db.collection('users').count().get();
    const totalUsers = usersSnap.data().count;

    // 2. Get total analyses count
    const analysesSnap = await db.collection('analyses').count().get();
    const totalAnalyses = analysesSnap.data().count;

    // 3. Query analyses to calculate tech distributions, averages, and readiness
    const allAnalysesSnap = await db
      .collection('analyses')
      .where('status', '==', 'completed')
      .limit(100) // limit traversal to latest 100 for safety and speed
      .get();

    const docs = allAnalysesSnap.docs.map(doc => doc.data());
    
    let totalScoreSum = 0;
    let readyCount = 0;
    const techDistribution: Record<string, number> = {};

    docs.forEach(doc => {
      totalScoreSum += doc.scores?.overall || 0;
      if (doc.deployment?.ready) {
        readyCount++;
      }

      // Collect detected frameworks
      const framework = doc.deployment?.detectedFramework;
      if (framework) {
        techDistribution[framework] = (techDistribution[framework] || 0) + 1;
      }
    });

    const completedCount = docs.length;
    const averageScore = completedCount > 0 ? Math.round(totalScoreSum / completedCount) : 0;
    const deploymentReadyRate = completedCount > 0 ? Math.round((readyCount / completedCount) * 100) : 0;

    // Format top technologies
    const topTechnologies = Object.entries(techDistribution)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      message: 'Admin metrics fetched successfully',
      data: {
        totalUsers,
        totalAnalyses,
        averageScore,
        deploymentReadyRate,
        topTechnologies,
      },
    });

  } catch (error: any) {
    console.error('Failed to get admin analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve administrative analytics metrics',
      code: 'admin/analytics-error',
    });
  }
}

/**
 * Fetch platform-wide analyses logs
 */
export async function getAdminAnalyses(_req: AuthenticatedRequest, res: Response) {
  try {
    const snapshot = await db
      .collection('analyses')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const analyses = snapshot.docs.map(doc => doc.data());

    return res.status(200).json({
      success: true,
      message: 'Admin analyses logs fetched successfully',
      data: {
        analyses,
      },
    });
  } catch (error: any) {
    console.error('Failed to get admin analyses logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to query global analysis logs',
      code: 'admin/analyses-logs-error',
    });
  }
}
