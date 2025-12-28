import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const managers = [
      {
        email: 'admin@lightcastle.com',
        password: 'Admin@123',
        fullName: 'System Administrator',
        role: 'Super User',
        department: 'Administration',
      },
      {
        email: 'ops.manager@lightcastle.com',
        password: 'Manager@123',
        fullName: 'Operations Manager',
        role: 'Manager',
        department: 'Operations',
      },
      {
        email: 'finance.manager@lightcastle.com',
        password: 'Manager@123',
        fullName: 'Finance Manager',
        role: 'Manager',
        department: 'Finance',
      },
      {
        email: 'hr.manager@lightcastle.com',
        password: 'Manager@123',
        fullName: 'HR Manager',
        role: 'Manager',
        department: 'Human Resources',
      },
      {
        email: 'it.manager@lightcastle.com',
        password: 'Manager@123',
        fullName: 'IT Manager',
        role: 'Manager',
        department: 'Information Technology',
      },
    ];

    const results = [];

    for (const manager of managers) {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('email', manager.email)
        .maybeSingle();

      if (existingUser) {
        results.push({ email: manager.email, status: 'already_exists' });
        continue;
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: manager.email,
        password: manager.password,
        email_confirm: true,
      });

      if (authError) {
        results.push({ email: manager.email, status: 'error', error: authError.message });
        continue;
      }

      const { error: dbError } = await supabaseAdmin.from('users').insert({
        id: authData.user.id,
        email: manager.email,
        password_hash: 'managed_by_supabase',
        full_name: manager.fullName,
        role: manager.role,
        department: manager.department,
        status: 'Active',
      });

      if (dbError) {
        results.push({ email: manager.email, status: 'error', error: dbError.message });
      } else {
        results.push({ email: manager.email, status: 'created' });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});