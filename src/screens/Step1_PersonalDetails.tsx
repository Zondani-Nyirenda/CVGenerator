import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Alert } from 'react-native';

import ScreenLayout from '../components/ScreenLayout';
import FormField from '../components/FormField';
import { useCVStore } from '../store/cvStore';
import { RootStackParamList } from '../types/navigation';

const schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  jobTitle: z.string().min(2, 'Job title is required'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  email: z.string().email('Enter a valid email address'),
  city: z.string().min(2, 'City is required'),
  linkedin: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type Nav = StackNavigationProp<RootStackParamList, 'Step1'>;

export default function Step1_PersonalDetails() {
  const navigation = useNavigation<Nav>();
  const { personal, setPersonal, persistToSQLite } = useCVStore();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: personal.fullName,
      jobTitle: personal.jobTitle,
      phone: personal.phone,
      email: personal.email,
      city: personal.city,
      linkedin: personal.linkedin ?? '',
    },
    mode: 'onChange',
  });

  const onContinue = async (data: FormData) => {
    try {
      setLoading(true);
      console.log('Form data being saved:', data);
      
      setPersonal(data);
      await persistToSQLite();
      
      console.log('Data saved, navigating to Step2');
      navigation.navigate('Step2');
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert('Error', 'Failed to save your information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = handleSubmit(onContinue, (errors) => {
    console.log('Form validation errors:', errors);
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      Alert.alert('Validation Error', firstError.message as string);
    }
  });

  return (
    <ScreenLayout
      step={1}
      title="Let's start with you"
      subtitle="Fill in your basic contact information"
      onContinue={handleFormSubmit}
      continueEnabled={isValid}
      loading={loading}
    >
      <FormField<FormData> 
        label="Full name" 
        name="fullName" 
        control={control} 
        errors={errors} 
        placeholder="e.g. Tendai Mwale" 
        autoCapitalize="words" 
      />
      
      <FormField<FormData> 
        label="Job title / headline" 
        name="jobTitle" 
        control={control} 
        errors={errors} 
        placeholder="e.g. Frontend Developer" 
        autoCapitalize="words" 
      />
      
      <FormField<FormData> 
        label="Phone" 
        name="phone" 
        control={control} 
        errors={errors} 
        placeholder="+260 9x xxx xxxx" 
        keyboardType="phone-pad" 
      />
      
      <FormField<FormData> 
        label="Email" 
        name="email" 
        control={control} 
        errors={errors} 
        placeholder="you@email.com" 
        keyboardType="email-address" 
        autoCapitalize="none" 
      />
      
      <FormField<FormData> 
        label="City / Location" 
        name="city" 
        control={control} 
        errors={errors} 
        placeholder="e.g. Lusaka, Zambia" 
        autoCapitalize="words" 
      />
      
      <FormField<FormData> 
        label="LinkedIn (optional)" 
        name="linkedin" 
        control={control} 
        errors={errors} 
        placeholder="linkedin.com/in/yourname" 
        autoCapitalize="none" 
        keyboardType="url" 
      />
    </ScreenLayout>
  );
}