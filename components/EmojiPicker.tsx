
import React from 'react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EMOJI_CATEGORIES = {
  'Common': ['📚', '💡', '🎯', '🧪', '⚙️', '📈', '🧠', '⭐️', '❤️', '✅'],
  'Flags': ['🇫🇷', '🇪🇸', '🇩🇪', '🇮🇹', '🇯🇵', '🇨🇳', '🇰🇷', '🇷🇺', '🇺🇸', '🇬🇧'],
  'Objects': ['🔬', '💻', '🎨', '🎵', '💼', '🔑', '🖋️', '🔭', '🩺', '⚖️'],
  'Nature': ['🌱', '🌳', '🌍', '☀️', '🌙', '🌊', '🔥', '🐾', '🍎', '🌸'],
};

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
  return (
    <div className="space-y-2 pt-2">
      {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
        <div key={category}>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">{category}</p>
          <div className="grid grid-cols-10 gap-1">
            {emojis.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => onEmojiSelect(emoji)}
                className="text-2xl p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EmojiPicker;