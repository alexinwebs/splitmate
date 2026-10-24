import { useLocalSearchParams } from 'expo-router';

import { ExpenseForm } from '../../../features/expenseForm/ExpenseForm';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ExpenseForm mode="edit" expenseId={id} />;
}
