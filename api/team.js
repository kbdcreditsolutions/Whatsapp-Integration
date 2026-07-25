const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware to ensure user is an Admin
const requireAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ error: 'Invalid token' });

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, workspace_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    req.profile = profile;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/team/members - List all workspace members
router.get('/members', requireAdmin, async (req, res) => {
  try {
    const { data: members, error } = await supabase
      .from('profiles')
      .select('id, email, role, created_at')
      .eq('workspace_id', req.profile.workspace_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Also fetch pending invitations
    const { data: invites, error: inviteError } = await supabase
      .from('workspace_invitations')
      .select('id, email, role, status, token, expires_at, created_at')
      .eq('workspace_id', req.profile.workspace_id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
      
    if (inviteError) throw inviteError;

    res.json({ members, invites });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// POST /api/team/invite - Create an invitation link
router.post('/invite', requireAdmin, async (req, res) => {
  const { email, role } = req.body;
  if (!email || !role) {
    return res.status(400).json({ error: 'Email and role are required' });
  }

  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const { data, error } = await supabase
      .from('workspace_invitations')
      .insert({
        workspace_id: req.profile.workspace_id,
        email: email.toLowerCase(),
        role: role,
        token: token,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, invitation: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create invitation' });
  }
});

// POST /api/team/accept - Accept an invitation
router.post('/accept', async (req, res) => {
  const { token, userId } = req.body;
  if (!token || !userId) {
    return res.status(400).json({ error: 'Token and User ID required' });
  }

  try {
    // 1. Verify token
    const { data: invite, error: inviteError } = await supabase
      .from('workspace_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inviteError || !invite) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    // 2. Update user profile using Service Role
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        workspace_id: invite.workspace_id,
        role: invite.role
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // 3. Mark invite as accepted
    await supabase
      .from('workspace_invitations')
      .update({ status: 'accepted' })
      .eq('id', invite.id);

    res.json({ success: true, message: 'Joined workspace successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

module.exports = router;
