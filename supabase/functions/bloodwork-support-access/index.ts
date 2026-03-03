import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface InviteInput {
  invitee_email: string;
  invitee_name: string;
  access_level: 'read_only' | 'read_write';
}

interface AcceptInviteInput {
  invitation_token: string;
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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    // GET /invitations - List pending invitations sent by user
    if (req.method === 'GET' && action === 'invitations') {
      const { data, error } = await supabase
        .from('bloodwork_support_invitations')
        .select('*')
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false });

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

    // GET /access - List active support access (both owned and granted)
    if (req.method === 'GET' && action === 'access') {
      const { data: ownedAccess, error: ownedError } = await supabase
        .from('bloodwork_support_access')
        .select('*')
        .eq('owner_user_id', user.id);

      const { data: grantedAccess, error: grantedError } = await supabase
        .from('bloodwork_support_access')
        .select('*')
        .eq('supporter_user_id', user.id);

      if (ownedError || grantedError) {
        return new Response(
          JSON.stringify({
            error: ownedError?.message || grantedError?.message,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          owned: ownedAccess || [],
          granted: grantedAccess || [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // POST /invite - Create new invitation
    if (req.method === 'POST' && action === 'invite') {
      const body: InviteInput = await req.json();

      if (!body.invitee_email || !body.invitee_name || !body.access_level) {
        return new Response(
          JSON.stringify({
            error: 'invitee_email, invitee_name, and access_level are required',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Check if invitation already exists for this email
      const { data: existing } = await supabase
        .from('bloodwork_support_invitations')
        .select('id')
        .eq('owner_user_id', user.id)
        .eq('invitee_email', body.invitee_email)
        .eq('status', 'pending')
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({
            error: 'Pending invitation already exists for this email',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data, error } = await supabase
        .from('bloodwork_support_invitations')
        .insert({
          owner_user_id: user.id,
          invitee_email: body.invitee_email,
          invitee_name: body.invitee_name,
          access_level: body.access_level,
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

    // POST /accept - Accept an invitation
    if (req.method === 'POST' && action === 'accept') {
      const body: AcceptInviteInput = await req.json();

      if (!body.invitation_token) {
        return new Response(
          JSON.stringify({ error: 'invitation_token is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Find invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('bloodwork_support_invitations')
        .select('*')
        .eq('invitation_token', body.invitation_token)
        .eq('status', 'pending')
        .maybeSingle();

      if (inviteError || !invitation) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired invitation' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Check if invitation has expired
      if (new Date(invitation.expires_at) < new Date()) {
        await supabase
          .from('bloodwork_support_invitations')
          .update({ status: 'expired' })
          .eq('id', invitation.id);

        return new Response(
          JSON.stringify({ error: 'Invitation has expired' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Get user's profile for display name
      const { data: profile } = await supabase.auth.getUser();
      const supporterName = profile?.user?.email || 'Unknown';

      // Create access record
      const { data: access, error: accessError } = await supabase
        .from('bloodwork_support_access')
        .insert({
          owner_user_id: invitation.owner_user_id,
          supporter_user_id: user.id,
          supporter_name: supporterName,
          access_level: invitation.access_level,
        })
        .select()
        .single();

      if (accessError) {
        return new Response(JSON.stringify({ error: accessError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Mark invitation as accepted
      await supabase
        .from('bloodwork_support_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      return new Response(JSON.stringify(access), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE /revoke?id=<access_id> - Revoke access
    if (req.method === 'DELETE' && action === 'revoke') {
      const accessId = url.searchParams.get('id');

      if (!accessId) {
        return new Response(
          JSON.stringify({ error: 'Access ID required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // User can revoke if they are either the owner or the supporter
      const { error } = await supabase
        .from('bloodwork_support_access')
        .delete()
        .eq('id', accessId)
        .or(`owner_user_id.eq.${user.id},supporter_user_id.eq.${user.id}`);

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

    // DELETE /cancel-invite?id=<invitation_id> - Cancel pending invitation
    if (req.method === 'DELETE' && action === 'cancel-invite') {
      const inviteId = url.searchParams.get('id');

      if (!inviteId) {
        return new Response(
          JSON.stringify({ error: 'Invitation ID required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { error } = await supabase
        .from('bloodwork_support_invitations')
        .update({ status: 'revoked' })
        .eq('id', inviteId)
        .eq('owner_user_id', user.id);

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

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Bloodwork support access error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
