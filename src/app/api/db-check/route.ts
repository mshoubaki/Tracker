import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // 1. Test Supabase connection by fetching a single row from a table
    // We try to fetch from 'tasks' to see if it exists
    const { data, error, status } = await supabase
      .from('tasks')
      .select('id')
      .limit(1);

    if (error && status !== 406) { // 406 Not Acceptable can happen if table doesn't exist
       // Check if error is specifically about table not existing
       if (error.code === 'PGRST116' || error.message.includes('relation "tasks" does not exist')) {
         return NextResponse.json({ 
           status: 'error', 
           message: 'Database connected, but "tasks" table is missing. Please ensure you have run the migrations or created the tables.',
           authenticated: true,
           error: error
         }, { status: 200 });
       }
       throw error;
    }

    // 2. Test app_settings table
    const { error: settingsError } = await supabase
      .from('app_settings')
      .select('id')
      .limit(1);

    if (settingsError && !settingsError.message.includes('relation "app_settings" does not exist')) {
      // If it's a real error (not just missing table), report it
      return NextResponse.json({ 
        status: 'error', 
        message: `Error checking app_settings: ${settingsError.message}`,
        authenticated: true,
        error: settingsError
      }, { status: 200 });
    }

    return NextResponse.json({ 
      status: 'success', 
      message: 'Supabase connection is working and tables are accessible.',
      authenticated: true
    });
  } catch (error: any) {
    console.error('Database Check Error:', error);
    
    // Check for specific connection errors
    if (error.message?.includes('FetchError') || error.message?.includes('failed to fetch')) {
        return NextResponse.json({ 
          status: 'disconnected', 
          message: 'Could not reach Supabase URL. Please check your NEXT_PUBLIC_SUPABASE_URL in Settings.',
          error: error.message
        }, { status: 200 });
    }

    if (error.message?.includes('JWT') || error.status === 401 || error.status === 403) {
        return NextResponse.json({ 
          status: 'unauthorized', 
          message: 'Invalid API Key. Please check your NEXT_PUBLIC_SUPABASE_ANON_KEY in Settings.',
          error: error.message
        }, { status: 200 });
    }

    return NextResponse.json({ 
      status: 'error', 
      message: error.message || 'An unknown database error occurred.',
      error: error
    }, { status: 200 });
  }
}
