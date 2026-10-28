import React from 'react';
import {
  Hammer,
  Wrench,
  Zap,
  Paintbrush,
  Fan,
  Tv,
  Sparkles,
  ShieldCheck,
  Droplets,
  Flame,
  Lock,
  Truck,
  Scissors,
  Wind,
  Camera,
  Layers,
  Cpu,
  Bug,
  Home,
  Package,
  Briefcase,
  HelpCircle
} from 'lucide-react';

export const SYSTEM_ICON_MAP = {
  Hammer,
  Wrench,
  Zap,
  Paintbrush,
  Fan,
  Tv,
  Sparkles,
  ShieldCheck,
  Droplets,
  Flame,
  Lock,
  Truck,
  Scissors,
  Wind,
  Camera,
  Layers,
  Cpu,
  Bug,
  Home,
  Package,
  Briefcase
};

/**
 * Renders either a System Lucide Icon or a Custom Uploaded Icon (Base64/URL).
 */
export const CategoryIcon = ({
  icon,
  iconName,
  iconValue,
  className = "w-5 h-5",
  imgClassName = "w-full h-full object-contain p-1",
  fallback = Briefcase
}) => {
  // Determine if there is a custom icon value
  const val = icon?.iconValue || iconValue || iconName;
  const isCustomType = icon?.iconType === 'CUSTOM';
  const isCustomValue = val && (val.startsWith('data:image') || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/'));

  if (isCustomType || isCustomValue) {
    return (
      <img
        src={val}
        alt={icon?.name || iconName || 'Category Icon'}
        className={`${imgClassName} rounded`}
        onError={(e) => {
          // Fallback to brief icon if image fails
          e.target.style.display = 'none';
          if (e.target.nextSibling) {
            e.target.nextSibling.style.display = 'block';
          }
        }}
      />
    );
  }

  const IconComp = SYSTEM_ICON_MAP[val] || SYSTEM_ICON_MAP[iconName] || fallback;
  return <IconComp className={className} />;
};

export default CategoryIcon;
