
import React from 'react';

export const LOOPLABS_LOGO = (className?: string) => (
  <svg viewBox="0 0 100 100" className={className || "w-12 h-12"}>
    <path
      d="M20,50 Q20,30 40,30 Q60,30 60,50 Q60,70 80,70 Q100,70 100,50 Q100,30 80,30 Q70,30 65,40 M35,60 Q30,70 20,70 Q0,70 0,50 Q0,30 20,30"
      fill="none"
      stroke="currentColor"
      strokeWidth="8"
      strokeLinecap="round"
    />
    <path
      d="M60,30 L65,20 M40,70 L35,80"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <circle cx="50" cy="50" r="5" fill="currentColor" />
  </svg>
);

export const REWARDS: any[] = [
  { id: '1', name: 'Eco Tote Bag', cost: 500, description: 'Handmade from recycled cotton.', icon: '🛍️' },
  { id: '2', name: 'Bamboo Straw Set', cost: 200, description: 'Reusable and biodegradable.', icon: '🥤' },
  { id: '3', name: '$5 Donation to Reforest', cost: 1000, description: 'We plant 5 trees in your name.', icon: '🌳' },
  { id: '4', name: 'Local Composting Kit', cost: 1500, description: 'Turn food scraps into gold.', icon: '🌱' },
];
