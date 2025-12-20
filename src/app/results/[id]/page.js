"use client";
import GameResults from '@/components/GameResults';
import { useParams } from 'next/navigation';

export default function ResultsPage() {
  const params = useParams();
  const shareableId = params?.id;

  return <GameResults shareableId={shareableId} />;
}

