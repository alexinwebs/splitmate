import { useRouter } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChoiceChips, type ChoiceOption } from '../../components/ChoiceChips';
import { EmptyState } from '../../components/EmptyState';
import { notify } from '../../components/dialogs';
import {
  AppText,
  Chip,
  ClayButton,
  ClayInput,
  ClaySurface,
  Screen,
  ScreenHeader,
  SegmentedControl,
  radii,
  tones,
  type IconName,
} from '../../design';
import { appStore, useAppState } from '../../data/store';
import {
  CATEGORY_LABELS,
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
  type Group,
  type Person,
} from '../../domain/models';
import { formatBps, formatMoney } from '../../domain/money';
import {
  QUICK_DATES,
  changeGroup,
  evaluateForm,
  formStateFromExpense,
  initialFormState,
  setAllParticipants,
  toggleParticipant,
  type FormMethod,
  type FormState,
} from './formLogic';
import { ParticipantRow } from './ParticipantRow';

type Props =
  | { mode: 'create'; initialGroupId?: string }
  | { mode: 'edit'; expenseId: string };

const CATEGORY_ICONS: Record<ExpenseCategory, IconName> = {
  food: 'restaurant-outline',
  groceries: 'basket-outline',
  shopping: 'bag-handle-outline',
  travel: 'car-outline',
  entertainment: 'film-outline',
  bills: 'flash-outline',
  other: 'ellipsis-horizontal',
};

const CATEGORY_OPTIONS: ChoiceOption<ExpenseCategory>[] = EXPENSE_CATEGORIES.map((value) => ({
  value,
  label: CATEGORY_LABELS[value],
  icon: CATEGORY_ICONS[value],
}));

const METHOD_LABELS = ['Equal', 'Exact', 'Percent', 'Shares'] as const;
const METHOD_BY_LABEL: Record<(typeof METHOD_LABELS)[number], FormMethod> = {
  Equal: 'equal',
  Exact: 'exact',
  Percent: 'percent',
  Shares: 'shares',
};
const LABEL_BY_METHOD: Record<FormMethod, (typeof METHOD_LABELS)[number]> = {
  equal: 'Equal',
  exact: 'Exact',
  percent: 'Percent',
  shares: 'Shares',
};
const TEXT_KEY = {
  exact: 'exactText',
  percent: 'percentText',
  shares: 'sharesText',
} as const;

function FieldError({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <AppText variant="small" color={tones.danger.fg} style={styles.fieldError}>
      {text}
    </AppText>
  );
}

function Label({ children }: { children: string }) {
  return (
    <AppText variant="caption" style={styles.label}>
      {children}
    </AppText>
  );
}

type BodyProps = {
  mode: 'create' | 'edit';
  expenseId?: string;
  groups: Group[];
  people: Person[];
  meId: string;
  initialState: FormState;
  header: ReactNode;
};

function FormBody({ mode, expenseId, groups, people, meId, initialState, header }: BodyProps) {
  const router = useRouter();
  const [state, setState] = useState<FormState>(initialState);
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState(false);

  const group = groups.find((g) => g.id === state.groupId) ?? groups[0];
  const evaluation = useMemo(() => evaluateForm(state, group), [state, group]);
  const { errors, progress, preview } = evaluation;

  const patch = (changes: Partial<FormState>) => setState((s) => ({ ...s, ...changes }));
  const nameOf = (id: string): string => people.find((p) => p.id === id)?.name ?? 'Unknown';
  const labelOf = (id: string): string => (id === meId ? `${nameOf(id)} (You)` : nameOf(id));

  const textFor = (id: string): string => {
    if (state.method === 'exact') return state.exactText[id] ?? '';
    if (state.method === 'percent') return state.percentText[id] ?? '';
    return state.sharesText[id] ?? '1';
  };
  const setTextFor = (id: string, text: string) => {
    if (state.method === 'equal') return;
    const key = TEXT_KEY[state.method];
    setState((s) => ({ ...s, [key]: { ...s[key], [id]: text } }));
  };
  const shareLabelFor = (id: string): string | null => {
    const share = preview?.find((s) => s.memberId === id);
    return share ? formatMoney(share.amountPaise) : null;
  };

  let progressNote: { text: string; tone: 'success' | 'warning' | 'danger' } | null = null;
  if (progress?.kind === 'amount') {
    if (progress.remainingPaise > 0) {
      progressNote = { text: `${formatMoney(progress.remainingPaise)} left to assign`, tone: 'warning' };
    } else if (progress.remainingPaise < 0) {
      progressNote = { text: `${formatMoney(-progress.remainingPaise)} over the total`, tone: 'danger' };
    } else {
      progressNote = { text: 'All assigned', tone: 'success' };
    }
  } else if (progress?.kind === 'percent') {
    if (progress.remainingBps > 0) {
      progressNote = { text: `${formatBps(progress.remainingBps)} left to assign`, tone: 'warning' };
    } else if (progress.remainingBps < 0) {
      progressNote = { text: `${formatBps(-progress.remainingBps)} over 100%`, tone: 'danger' };
    } else {
      progressNote = { text: 'Adds up to 100%', tone: 'success' };
    }
  }

  const allSelected = group.memberIds.every((id) => state.participantIds.includes(id));

  const onSave = async () => {
    const draft = evaluation.draft;
    if (!draft) {
      setShowErrors(true);
      return;
    }
    setBusy(true);
    try {
      if (mode === 'edit' && expenseId) {
        await appStore.updateExpense(expenseId, draft);
        router.back();
      } else {
        const saved = await appStore.addExpense(draft);
        router.replace({ pathname: '/bill/[id]', params: { id: saved.id } });
      }
    } catch (error) {
      notify('Could not save expense', error instanceof Error ? error.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      header={header}
      footer={
        <ClayButton
          label={mode === 'edit' ? 'Save Changes' : 'Save Expense'}
          loading={busy}
          onPress={onSave}
        />
      }
    >
      {mode === 'create' && groups.length > 1 ? (
        <View style={styles.field}>
          <Label>Group</Label>
          <ChoiceChips
            options={groups.map((g) => ({ value: g.id, label: g.name }))}
            value={group.id}
            onChange={(id) => {
              const next = groups.find((g) => g.id === id);
              if (next) setState((s) => changeGroup(s, next, meId));
            }}
          />
        </View>
      ) : (
        <View style={styles.field}>
          <Label>Group</Label>
          <Chip label={group.name} tone="lavender" icon="people-outline" />
          {mode === 'edit' ? (
            <AppText variant="small" style={styles.hint}>
              An expense can’t be moved to another group.
            </AppText>
          ) : null}
        </View>
      )}

      <View style={styles.field}>
        <ClayInput
          label="Description"
          value={state.title}
          onChangeText={(text) => patch({ title: text })}
          onClear={() => patch({ title: '' })}
          placeholder="e.g. Dinner at Toit"
          maxLength={80}
          autoCapitalize="sentences"
        />
        {showErrors ? <FieldError text={errors.title} /> : null}
      </View>

      <View style={styles.field}>
        <ClayInput
          label="Amount (₹)"
          leftIcon="cash-outline"
          value={state.amountText}
          onChangeText={(text) => patch({ amountText: text })}
          onClear={() => patch({ amountText: '' })}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        {showErrors ? <FieldError text={errors.amount} /> : null}
      </View>

      <View style={styles.field}>
        <ClayInput
          label="Date"
          leftIcon="calendar-outline"
          value={state.dateText}
          onChangeText={(text) => patch({ dateText: text })}
          placeholder="YYYY-MM-DD"
          autoCorrect={false}
          autoCapitalize="none"
          maxLength={10}
        />
        <View style={styles.quickDates}>
          <ClayButton
            label="Today"
            variant="outline"
            size="sm"
            onPress={() => patch({ dateText: QUICK_DATES.today() })}
          />
          <ClayButton
            label="Yesterday"
            variant="outline"
            size="sm"
            onPress={() => patch({ dateText: QUICK_DATES.yesterday() })}
          />
        </View>
        {showErrors ? <FieldError text={errors.date} /> : null}
      </View>

      <View style={styles.field}>
        <Label>Category</Label>
        <ChoiceChips
          options={CATEGORY_OPTIONS}
          value={state.category}
          onChange={(category) => patch({ category })}
        />
      </View>

      <View style={styles.field}>
        <Label>Paid by</Label>
        <ChoiceChips
          options={group.memberIds.map((id) => ({
            value: id,
            label: id === meId ? 'You' : nameOf(id),
          }))}
          value={state.payerId}
          onChange={(payerId) => patch({ payerId })}
        />
        {showErrors ? <FieldError text={errors.payer} /> : null}
      </View>

      <View style={styles.field}>
        <Label>How to split</Label>
        <SegmentedControl
          options={METHOD_LABELS}
          value={LABEL_BY_METHOD[state.method]}
          onChange={(label) => patch({ method: METHOD_BY_LABEL[label] })}
        />
      </View>

      <View style={styles.field}>
        <View style={styles.splitHeader}>
          <AppText variant="headline">Split between</AppText>
          <ClayButton
            label={allSelected ? 'Clear' : 'Select all'}
            variant="secondary"
            size="sm"
            onPress={() => setState((s) => setAllParticipants(s, group, !allSelected))}
          />
        </View>
        <ClaySurface variant="raised" radius={radii.xl} style={styles.people}>
          {group.memberIds.map((id, i) => (
            <ParticipantRow
              key={id}
              name={labelOf(id)}
              selected={state.participantIds.includes(id)}
              onToggle={() => setState((s) => toggleParticipant(s, id))}
              method={state.method}
              value={textFor(id)}
              onChangeValue={(text) => setTextFor(id, text)}
              shareLabel={shareLabelFor(id)}
              error={showErrors ? errors.members[id] : undefined}
              showDivider={i < group.memberIds.length - 1}
            />
          ))}
        </ClaySurface>

        {progressNote ? (
          <View style={styles.progress}>
            <Chip
              label={progressNote.text}
              tone={progressNote.tone}
              icon={
                progressNote.tone === 'success'
                  ? 'checkmark-circle'
                  : progressNote.tone === 'danger'
                    ? 'alert-circle-outline'
                    : 'time-outline'
              }
            />
          </View>
        ) : null}
        {state.method === 'equal' ? (
          <AppText variant="small" style={styles.hint}>
            Shares are calculated to the paisa. Any extra paise go to the first people in the list.
          </AppText>
        ) : null}
        {state.method === 'shares' ? (
          <AppText variant="small" style={styles.hint}>
            A person with 2 shares pays twice as much as a person with 1. Use whole numbers.
          </AppText>
        ) : null}
        {showErrors ? <FieldError text={errors.participants} /> : null}
        {showErrors && !progressNote ? <FieldError text={errors.split} /> : null}
        {showErrors && progressNote && progressNote.tone !== 'success' ? (
          <FieldError text={errors.split} />
        ) : null}
      </View>

      <View style={styles.field}>
        <ClayInput
          label="Note (optional)"
          value={state.note}
          onChangeText={(text) => patch({ note: text })}
          onClear={() => patch({ note: '' })}
          placeholder="Anything worth remembering"
          maxLength={200}
        />
        {showErrors ? <FieldError text={errors.note} /> : null}
      </View>
    </Screen>
  );
}

export function ExpenseForm(props: Props) {
  const router = useRouter();
  const { groups, people, me, expenses } = useAppState();

  const header = (
    <ScreenHeader
      title={props.mode === 'edit' ? 'Edit Expense' : 'Add Expense'}
      subtitle={props.mode === 'edit' ? 'Update the details' : 'Record an expense manually'}
      onBack={() => router.back()}
    />
  );

  if (groups.length === 0) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="people-outline"
          title="Create a group first"
          message="Expenses belong to a group, so you can split them with the right people."
          actionLabel="Create a group"
          onAction={() => router.replace('/group/new')}
        />
      </Screen>
    );
  }

  if (props.mode === 'edit') {
    const expense = expenses.find((e) => e.id === props.expenseId);
    if (!expense) {
      return (
        <Screen header={header}>
          <EmptyState
            icon="receipt-outline"
            title="Expense not found"
            message="This expense no longer exists."
            actionLabel="Go back"
            onAction={() => router.back()}
          />
        </Screen>
      );
    }
    const initial = formStateFromExpense(expense);
    if (!initial) {
      return (
        <Screen header={header}>
          <EmptyState
            icon="information-circle-outline"
            title="Can’t edit this expense yet"
            message="It was paid by more than one person, and this form only supports one payer. Editing it here would change who paid."
            actionLabel="Go back"
            onAction={() => router.back()}
          />
        </Screen>
      );
    }
    return (
      <FormBody
        key={expense.id}
        mode="edit"
        expenseId={expense.id}
        groups={groups}
        people={people}
        meId={me.id}
        initialState={initial}
        header={header}
      />
    );
  }

  const start = groups.find((g) => g.id === props.initialGroupId) ?? groups[0];
  return (
    <FormBody
      key="create"
      mode="create"
      groups={groups}
      people={people}
      meId={me.id}
      initialState={initialFormState(start, me.id)}
      header={header}
    />
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 18 },
  label: { marginBottom: 8, marginLeft: 4 },
  hint: { marginTop: 8, marginLeft: 4 },
  fieldError: { marginTop: 6, marginLeft: 4 },
  quickDates: { flexDirection: 'row', gap: 8, marginTop: 10 },
  splitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  people: { paddingHorizontal: 14, paddingVertical: 2 },
  progress: { marginTop: 12 },
});
