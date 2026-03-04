import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface KeyContactInput {
  contact_name: string;
  role: string;
  establishment?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const url = new URL(req.url);
    const contactId = url.searchParams.get('id');

    // GET: List all contacts or get specific contact
    if (req.method === 'GET') {
      if (contactId) {
        const { data, error } = await supabase
          .from('bloodwork_key_contacts')
          .select('*')
          .eq('id', contactId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!data) {
          return new Response(
            JSON.stringify({ error: 'Contact not found' }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        const { data, error } = await supabase
          .from('bloodwork_key_contacts')
          .select('*')
          .eq('user_id', user.id)
          .order('contact_name', { ascending: true });

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify(data || []), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // POST: Create new contact
    if (req.method === 'POST') {
      const body: KeyContactInput = await req.json();

      if (!body.contact_name || !body.role) {
        return new Response(
          JSON.stringify({
            error: 'contact_name and role are required',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data, error } = await supabase
        .from('bloodwork_key_contacts')
        .insert({
          user_id: user.id,
          contact_name: body.contact_name,
          role: body.role,
          establishment: body.establishment || null,
          email: body.email || null,
          phone: body.phone || null,
          notes: body.notes || null,
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT: Update existing contact
    if (req.method === 'PUT') {
      if (!contactId) {
        return new Response(
          JSON.stringify({ error: 'Contact ID required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const body: Partial<KeyContactInput> = await req.json();

      const { data, error } = await supabase
        .from('bloodwork_key_contacts')
        .update({
          contact_name: body.contact_name,
          role: body.role,
          establishment: body.establishment,
          email: body.email,
          phone: body.phone,
          notes: body.notes,
        })
        .eq('id', contactId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!data) {
        return new Response(
          JSON.stringify({ error: 'Contact not found or unauthorized' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE: Remove contact
    if (req.method === 'DELETE') {
      if (!contactId) {
        return new Response(
          JSON.stringify({ error: 'Contact ID required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { error } = await supabase
        .from('bloodwork_key_contacts')
        .delete()
        .eq('id', contactId)
        .eq('user_id', user.id);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Bloodwork key contacts error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
