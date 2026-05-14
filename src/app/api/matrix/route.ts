import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // 1. Fetch Tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true });

    if (tasksError) throw tasksError;

    // 2. Fetch Settings
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 'main')
      .single();

    // If settings don't exist yet, we'll return defaults
    const config = settings || {};
    const finalTitle = config.app_title || config.appTitle || 'مصفوفة مراحل العمليات';
    const finalDescription = config.app_description || config.appDescription || 'Enterprise Status Tracker - تتبع حالة المشاريع بدقة';

    return NextResponse.json({
      tasks: tasks || [],
      appTitle: finalTitle,
      appDescription: finalDescription
    });
  } catch (error: any) {
    console.error('Supabase Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { tasks: incomingTasks, appTitle, appDescription } = await req.json();

    // 1. Update Settings
    const { error: settingsError } = await supabase
      .from('app_settings')
      .upsert({ 
        id: 'main', 
        app_title: appTitle, 
        app_description: appDescription 
      });

    if (settingsError) {
       // Try fallback if snake_case fails
       const { error: fallbackError } = await supabase
         .from('app_settings')
         .upsert({ id: 'main', appTitle, appDescription });
       
       if (fallbackError) {
         console.error('Supabase settings upsert error:', fallbackError);
         throw fallbackError;
       }
    }

    // 2. Sync Tasks
    if (incomingTasks && Array.isArray(incomingTasks)) {
      console.log(`Syncing ${incomingTasks.length} tasks...`);
      const { error: tasksError } = await supabase
        .from('tasks')
        .upsert(incomingTasks.map((t: any) => {
          const dateVal = t.createdAt || t.created_at;
          return {
            id: t.id,
            title: t.title,
            phases: t.phases,
            created_at: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString()
          };
        }));

      if (tasksError) {
        console.error('Supabase tasks upsert error:', tasksError);
        throw tasksError;
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('Supabase Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (id) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    } else {
      // Bulk delete for reset
      const { error } = await supabase.from('tasks').delete().neq('id', 'placeholder-to-allow-bulk');
      if (error) throw error;
    }
    
    return NextResponse.json({ status: 'deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
