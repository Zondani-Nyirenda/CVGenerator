// navigation/RootNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import Step1_PersonalDetails from '../screens/Step1_PersonalDetails';
import Step2_Summary from '../screens/Step2_Summary';
import Step3_WorkExperience from '../screens/Step3_WorkExperience';
import Step4_Education from '../screens/Step4_Education';
import Step5_Skills from '../screens/Step5_Skills';
import Step6_Templates from '../screens/Step6_Templates';
import Step7_Preview from '../screens/Step7_Preview';
import Step8_Export from '../screens/Step8_Export';

import type { RootStackParamList } from '../types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' }
      }}
    >
      <Stack.Screen name="Step1" component={Step1_PersonalDetails} />
      <Stack.Screen name="Step2" component={Step2_Summary} />
      <Stack.Screen name="Step3" component={Step3_WorkExperience} />
      <Stack.Screen name="Step4" component={Step4_Education} />
      <Stack.Screen name="Step5" component={Step5_Skills} />
      <Stack.Screen name="Step6" component={Step6_Templates} />
      <Stack.Screen name="Step7" component={Step7_Preview} />
      <Stack.Screen name="Step8" component={Step8_Export} />
    </Stack.Navigator>
  );
}