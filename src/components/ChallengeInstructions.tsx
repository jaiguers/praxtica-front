import { useTheme } from '@/context/ThemeContext';

interface ChallengeInstructionsProps {
  content: string;
}

export default function ChallengeInstructions({ content }: ChallengeInstructionsProps) {
  const { isDarkMode } = useTheme();

  return (
    <div className={`prose max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
      <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <h2 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Instructions
        </h2>
        <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {content}
        </div>
      </div>
    </div>
  );
} 