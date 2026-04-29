import { Container, Title, Card, Text, Group } from "@mantine/core";
import useApiData from "../hooks/useApiData";
import { getInformationList } from "../utils/apiService";
import BackButton from '../utils/BackButton';

export default function InformationDashboard() {
  const { data, loading, error } = useApiData(getInformationList);

  if (loading) return <Text>読み込み中...</Text>;
  if (error) return <Text color="red">エラーが発生しました</Text>;

  return (
    <Container>
      <Group justify="space-between" align="center" mb="xl">
        <Title order={1}>情報提供一覧</Title>
        <BackButton to="/admin/dashboard" variant="outline" />
      </Group>

      {data?.length === 0 && (
        <Text c="dimmed">まだ情報提供はありません</Text>
      )}

    {data?.map((i) => (
        <Card key={i.id} withBorder shadow="sm" mb="md">
            <Title order={4}>{i.title}</Title>
                {i.festival_name && (
                <Text size="sm" c="dimmed">
                    対象祭り: {i.festival_name}
                </Text>
                )}
            <Text mt="sm">{i.content}</Text>
        </Card>
    ))}
    </Container>
  );
}
