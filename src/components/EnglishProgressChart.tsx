'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/context/ThemeContext';

interface ProgressData {
  skill: string;
  score: number;
}

interface EnglishProgressChartProps {
  data: ProgressData[];
  overallScore: number;
  level: string;
  levelCode: string;
  speakingTime: number;
}

export default function EnglishProgressChart({ 
  data, 
  overallScore, 
  level, 
  levelCode,
  speakingTime 
}: EnglishProgressChartProps) {
  const { isDarkMode } = useTheme();

  return (
    <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="mb-6">
        <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Your English Score
        </h2>
        <div className="flex items-baseline gap-2 mb-4">
          <span className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {level}
          </span>
          <span className={`text-2xl font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            {levelCode}
          </span>
        </div>
        <div className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {overallScore} out of 100
        </div>
      </div>

      <div className="mb-6">
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={data}>
            <PolarGrid stroke={isDarkMode ? '#4B5563' : '#E5E7EB'} />
            <PolarAngleAxis 
              dataKey="skill" 
              tick={{ fill: isDarkMode ? '#D1D5DB' : '#4B5563', fontSize: 12 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280', fontSize: 10 }}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke={isDarkMode ? '#60A5FA' : '#3B82F6'}
              fill={isDarkMode ? '#3B82F6' : '#3B82F6'}
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className={`flex items-start gap-2 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
        <svg
          className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Your score is based on <strong>{speakingTime} seconds</strong> of speaking. 
          This is just a first estimate — keep talking, and it will become more accurate!
        </p>
      </div>
    </div>
  );
}

