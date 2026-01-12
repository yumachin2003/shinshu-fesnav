import React, { useState, useEffect } from 'react';
import { createFestival, updateFestival } from '../utils/apiService';
import { useForm } from '@mantine/form';
import { TextInput, Textarea, NumberInput, Button, Box, Stack, Alert } from '@mantine/core';

const INITIAL_STATE = {
  name: '',
  date: '',
  location: '',
  description: '',
  access: '',
  attendance: '',
  latitude: '',
  longitude: '',
};

function FestivalRegistrationForm({ onFestivalAdded, festivalData }) {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const form = useForm({
    initialValues: INITIAL_STATE,
    validate: {
      name: (value) => (value.trim().length > 0 ? null : 'お祭り名は必須です'),
      date: (value) => (value ? null : '開催日は必須です'),
      location: (value) => (value.trim().length > 0 ? null : '開催場所は必須です'),
    },
  });

  // 編集モードの場合、初期値をセットする
  useEffect(() => {
    if (festivalData) {
      form.setValues(festivalData);
    } else {
      form.reset();
    }
  }, [festivalData, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    setSubmitError(null);
    try {
      if (festivalData?.id) {
        await updateFestival(festivalData.id, values);
        alert('お祭り情報が更新されました！');
      } else {
        await createFestival(values);
        alert('新しいお祭りが登録されました！');
      }
      form.reset(); // フォームをリセット
      if (onFestivalAdded) {
        onFestivalAdded(); // 親コンポーネントに通知してリストを更新
      }
    } catch (error) {
      console.error("Error adding festival:", error);
      setSubmitError(error.response?.data?.error || "お祭りの追加に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maw={600} mx="auto">
      {submitError && <Alert color="red" title="登録エラー" mb="md">{submitError}</Alert>}
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="お祭り名" placeholder="お祭り名を入力" withAsterisk {...form.getInputProps('name')} />
          <TextInput type="date" label="開催日" placeholder="開催日を選択" withAsterisk {...form.getInputProps('date')} />
          <TextInput label="開催場所" placeholder="開催場所を入力" withAsterisk {...form.getInputProps('location')} />
          <Textarea label="お祭りの説明" placeholder="お祭りの説明を入力" autosize minRows={3} {...form.getInputProps('description')} />
          <TextInput label="アクセス方法" placeholder="アクセス方法を入力" {...form.getInputProps('access')} />
          <NumberInput label="予想動員数" placeholder="半角数字で入力" {...form.getInputProps('attendance')} />
          <NumberInput label="緯度" placeholder="例: 36.64917" allowDecimal step={0.00001} precision={6} {...form.getInputProps('latitude')} />
          <NumberInput label="経度" placeholder="例: 138.19500" allowDecimal step={0.00001} precision={6} {...form.getInputProps('longitude')} />
          <Button type="submit" loading={loading}>
            {festivalData ? '更新する' : '登録する'}
          </Button>
        </Stack>
      </form>
    </Box>
  );
}

export default FestivalRegistrationForm;