import { adminSupabase as supabase } from '@/lib/supabase/admin'
import type { Expense, ExpenseSplit, Settlement } from '@/types'

export async function getExpensesByTrip(tripId: string): Promise<Expense[]> {
  
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('trip_id', tripId)
    .order('date', { ascending: false })

  if (error) throw error
  return data
}

export async function getExpenseById(expenseId: string): Promise<Expense | null> {
  
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', expenseId)
    .single()

  if (error) throw error
  return data
}

export async function createExpense(
  expense: Omit<Expense, 'id' | 'created_at'>
): Promise<Expense> {
  
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateExpense(
  expenseId: string,
  updates: Partial<Expense>
): Promise<Expense> {
  
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', expenseId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteExpense(expenseId: string): Promise<void> {
  
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId)
  if (error) throw error
}

export async function getSplitsForExpense(expenseId: string): Promise<ExpenseSplit[]> {
  
  const { data, error } = await supabase
    .from('expense_splits')
    .select('*')
    .eq('expense_id', expenseId)

  if (error) throw error
  return data
}

export async function upsertSplits(splits: Omit<ExpenseSplit, 'id'>[]): Promise<void> {

  const { error } = await supabase
    .from('expense_splits')
    .upsert(splits, { onConflict: 'expense_id,user_id' })

  if (error) throw error
}

export async function deleteSplitsForExpense(expenseId: string): Promise<void> {
  const { error } = await supabase.from('expense_splits').delete().eq('expense_id', expenseId)
  if (error) throw error
}

export async function getSettlementsByTrip(tripId: string): Promise<Settlement[]> {
  
  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createSettlement(
  settlement: Omit<Settlement, 'id' | 'created_at'>
): Promise<Settlement> {
  
  const { data, error } = await supabase
    .from('settlements')
    .insert(settlement)
    .select()
    .single()

  if (error) throw error
  return data
}
