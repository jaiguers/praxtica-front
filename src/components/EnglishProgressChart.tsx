'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/context/ThemeContext';
import { LockClosedIcon } from '@heroicons/react/24/outline';

interface ProgressData {
  skill: string;
  score: number;
}

interface ModuleTopic {
  name: string;
  color: string;
}

interface Module {
  id: number;
  title: string;
  currentMinutes: number;
  totalMinutes: number;
  isLocked: boolean;
  topics?: ModuleTopic[];
  description?: string;
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

  // Niveles CEFR en orden
  const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  
  // Función para determinar si un nivel está completado
  const isLevelCompleted = (level: string): boolean => {
    const currentIndex = cefrLevels.indexOf(levelCode.toUpperCase());
    const levelIndex = cefrLevels.indexOf(level);
    return levelIndex <= currentIndex;
  };

  // Calcular el porcentaje de progreso
  const getProgressPercentage = (): number => {
    const currentIndex = cefrLevels.indexOf(levelCode.toUpperCase());
    if (currentIndex === -1) return 0;
    // Cada nivel representa aproximadamente 16.67% (100% / 6 niveles)
    // Pero para una mejor visualización, usamos el índice + 1
    return ((currentIndex + 1) / cefrLevels.length) * 100;
  };

  const progressPercentage = getProgressPercentage();

  // Datos mock de módulos - en producción esto vendría de una API
  const modules: Module[] = [
    {
      id: 1,
      title: 'Module 1',
      currentMinutes: 0,
      totalMinutes: 30,
      isLocked: false,
      topics: [
        { name: 'articles', color: 'bg-purple-600' },
        { name: 'move', color: 'bg-amber-700' },
        { name: 'new', color: 'bg-amber-500' },
        { name: 'sound /ɪ/', color: 'bg-purple-800' },
        { name: 'sound /t/', color: 'bg-purple-800' },
        { name: 'sound /d/', color: 'bg-purple-800' }
      ],
      description: 'You talked 0 minutes. Speak 30 minutes more to complete module.'
    },
    {
      id: 2,
      title: 'Module 2',
      currentMinutes: 14,
      totalMinutes: 30,
      isLocked: false,
      topics: [
        { name: 'articles', color: 'bg-purple-600' },
        { name: 'move', color: 'bg-amber-700' },
        { name: 'new', color: 'bg-amber-500' },
        { name: 'sound /ɪ/', color: 'bg-purple-800' },
        { name: 'sound /t/', color: 'bg-purple-800' },
        { name: 'sound /d/', color: 'bg-purple-800' }
      ],
      description: 'You talked 14 minutes. Speak 16 minutes more to complete module.'
    },
    {
      id: 3,
      title: 'Module 3',
      currentMinutes: 0,
      totalMinutes: 30,
      isLocked: true,
      description: 'Topics will be available when you finish current module'
    }
  ];

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

      {/* Barra de progreso CEFR */}
      <div className="mb-6 w-full overflow-hidden">
        <div className="relative w-full px-3 sm:px-4">
          {/* Barra de fondo completa con gradiente opaco para niveles futuros */}
          <div className="relative h-14 rounded-full overflow-hidden" style={{
            background: 'linear-gradient(to right, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0.3) 30%, rgba(99, 102, 241, 0.3) 40%, rgba(139, 92, 246, 0.3) 50%, rgba(147, 51, 234, 0.3) 60%, rgba(147, 51, 234, 0.3) 100%)'
          }}>
            {/* Relleno de progreso con gradiente completo hasta el nivel alcanzado */}
            <div 
              className="absolute top-0 left-0 h-full transition-all duration-500"
              style={{ 
                width: `${progressPercentage}%`,
                background: progressPercentage <= 33.33
                  ? 'linear-gradient(to right, #3B82F6 0%, #3B82F6 100%)'
                  : progressPercentage <= 66.67
                  ? 'linear-gradient(to right, #3B82F6 0%, #6366F1 40%, #8B5CF6 50%, #8B5CF6 100%)'
                  : 'linear-gradient(to right, #3B82F6 0%, #6366F1 30%, #8B5CF6 45%, #9333EA 60%, #9333EA 100%)'
              }}
            />
            
            {/* Niveles CEFR */}
            <div className="absolute inset-0 flex items-center">
              {cefrLevels.map((cefrLevel, index) => {
                const isCompleted = isLevelCompleted(cefrLevel);
                // Calcular posición con espacio en los extremos para que los textos no se salgan
                const totalWidth = 100;
                const padding = 6; // 6% de padding en cada extremo
                const availableWidth = totalWidth - (padding * 2);
                const position = padding + (index / (cefrLevels.length - 1)) * availableWidth;
                
                return (
                  <div
                    key={cefrLevel}
                    className="absolute flex flex-col items-center"
                    style={{ 
                      left: `${position}%`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <div className={`text-sm font-semibold ${
                      isCompleted 
                        ? 'text-white drop-shadow-sm' 
                        : isDarkMode 
                          ? 'text-gray-500 opacity-40' 
                          : 'text-gray-400 opacity-40'
                    }`}>
                      {cefrLevel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={data}>
            <PolarGrid stroke={isDarkMode ? '#4B5563' : '#E5E7EB'} />
            <PolarAngleAxis 
              dataKey="skill" 
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              tick={(props: any) => {
                const { payload, x, y } = props;
                const skillData = data.find((item) => item.skill === payload.value);
                const score = skillData?.score || 0;
                
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      x={0}
                      y={0}
                      dy={-8}
                      textAnchor="middle"
                      className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                      style={{
                        filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))',
                        fill: isDarkMode ? '#60A5FA' : '#3B82F6'
                      }}
                    >
                      {score}%
                    </text>
                    <text
                      x={0}
                      y={0}
                      dy={12}
                      textAnchor="middle"
                      className="text-sm"
                      fill={isDarkMode ? '#9CA3AF' : '#6B7280'}
                    >
                      {payload.value}
                    </text>
                  </g>
                );
              }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={false}
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

      {/* Sección de Módulos */}
      <div className="mt-6 space-y-4">
        {modules.map((module) => {
          const progressPercentage = (module.currentMinutes / module.totalMinutes) * 100;
          const remainingMinutes = module.totalMinutes - module.currentMinutes;

          return (
            <div
              key={module.id}
              className={`p-5 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}
            >
              {/* Header del módulo */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {module.title}
                  </h3>
                  {module.isLocked && (
                    <LockClosedIcon className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  )}
                </div>
                {module.isLocked && (
                  <button
                    className={`px-4 py-1.5 text-sm font-medium rounded ${
                      isDarkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    SCORE UPDATE
                  </button>
                )}
              </div>

              {/* Descripción del progreso o mensaje de bloqueo */}
              {module.isLocked ? (
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {module.description}
                </p>
              ) : (
                <>
                  <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {module.description || `You talked ${module.currentMinutes} minutes. Speak ${remainingMinutes} minutes more to complete module.`}
                  </p>

                  {/* Contador de tiempo */}
                  <div className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {module.currentMinutes} / {module.totalMinutes} min
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-4">
                    <div className={`relative h-3 rounded-full overflow-hidden ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <div
                        className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(progressPercentage, 100)}%`,
                          background: 'linear-gradient(to right, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)'
                        }}
                      >
                        {/* Indicador circular al final del progreso */}
                        <div
                          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-blue-500"
                          style={{ borderColor: '#8B5CF6' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Current Topics */}
                  {module.topics && module.topics.length > 0 && (
                    <div>
                      <p className={`text-xs uppercase tracking-wider mb-2 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        CURRENT TOPICS
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {module.topics.map((topic, topicIndex) => (
                          <span
                            key={topicIndex}
                            className={`px-3 py-1 rounded-full text-sm font-medium text-white ${topic.color}`}
                          >
                            {topic.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

