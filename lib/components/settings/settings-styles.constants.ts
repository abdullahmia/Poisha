import type { Feather } from '@expo/vector-icons';
import type React from 'react';

export type TFeatherName = React.ComponentProps<typeof Feather>['name'];

export const rowClass = 'flex-row items-center justify-between px-4 py-4';
export const sectionLabelStyle = { fontFamily: 'Inter_500Medium', fontSize: 11, letterSpacing: 2 } as const;
export const rowLabelStyle = { fontFamily: 'Inter_500Medium', fontSize: 15 } as const;
export const rowSubStyle = { fontFamily: 'Inter_400Regular', fontSize: 12 } as const;
