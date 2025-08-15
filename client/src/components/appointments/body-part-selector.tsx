import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BodyPartSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const bodyParts = [
  { value: "head", label: "Head/Face" },
  { value: "neck", label: "Neck" },
  { value: "shoulder", label: "Shoulder" },
  { value: "upper_arm", label: "Upper Arm" },
  { value: "forearm", label: "Forearm" },
  { value: "hand", label: "Hand" },
  { value: "chest", label: "Chest" },
  { value: "back", label: "Back" },
  { value: "ribs", label: "Ribs" },
  { value: "abdomen", label: "Abdomen" },
  { value: "hip", label: "Hip" },
  { value: "thigh", label: "Thigh" },
  { value: "knee", label: "Knee" },
  { value: "calf", label: "Calf" },
  { value: "ankle", label: "Ankle" },
  { value: "foot", label: "Foot" },
];

export function BodyPartSelector({ value, onChange }: BodyPartSelectorProps) {
  const [selectedPart, setSelectedPart] = useState(value);

  const handleBodyPartClick = (part: string) => {
    setSelectedPart(part);
    onChange(part);
  };

  return (
    <div className="space-y-4">
      {/* Interactive Body Diagram */}
      <div className="relative">
        <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
          <div className="text-center">
            <svg
              className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">Click to select body part</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {selectedPart ? `Selected: ${bodyParts.find(p => p.value === selectedPart)?.label}` : "Interactive body diagram"}
            </p>
          </div>
        </div>
      </div>

      {/* Dropdown Selector */}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select body part" />
        </SelectTrigger>
        <SelectContent>
          {bodyParts.map((part) => (
            <SelectItem key={part.value} value={part.value}>
              {part.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Quick Selection Grid */}
      <div className="grid grid-cols-3 gap-2">
        {bodyParts.slice(0, 6).map((part) => (
          <button
            key={part.value}
            type="button"
            onClick={() => handleBodyPartClick(part.value)}
            className={cn(
              "text-xs px-3 py-2 rounded-md border transition-colors",
              selectedPart === part.value
                ? "bg-primary text-white border-primary"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            )}
          >
            {part.label}
          </button>
        ))}
      </div>
    </div>
  );
}
