import { useLocalSearchParams } from 'expo-router';

import { ExpenseForm } from '../../features/expenseForm/ExpenseForm';

export default function NewExpenseScreen() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  return <ExpenseForm mode="create" initialGroupId={groupId} />;
}
