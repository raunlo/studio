import type { InviteResponse } from '@/api/checklistServiceV1.schemas';

export type InviteStatus = 'active' | 'claimed' | 'expired';

export interface InviteDisplayData {
  id: number;
  url: string;
  status: InviteStatus;
  createdAt: Date;
  expiresAt: Date | null;
  claimedAt: Date | null;
  isSingleUse: boolean;
  expiryLabel: string;
  statusLabel: string;
}

/**
 * Copy text to clipboard with fallback for older browsers
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  console.log('Attempting to copy:', text);
  
  // Try modern clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Clipboard API success');
      return true;
    } catch (err) {
      console.error('Clipboard API failed:', err);
      // Fall through to fallback method
    }
  }

  // Fallback for older browsers or if clipboard API fails
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);
    
    // Select the text
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    
    const success = document.execCommand('copy');
    console.log('Fallback copy result:', success);
    document.body.removeChild(textarea);
    return success;
  } catch (err) {
    console.error('Fallback copy failed:', err);
    return false;
  }
}

/**
 * Get human-readable expiry label
 */
export function getExpiryLabel(
  expiresAt: Date | null,
  isExpired: boolean
): string {
  if (!expiresAt) return 'Never expires';
  if (isExpired) return 'Expired';

  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const hours = Math.ceil(diff / (1000 * 60 * 60));

  if (days > 1) return `Expires in ${days} days`;
  if (hours > 1) return `Expires in ${hours} hours`;
  return 'Expires soon';
}

/**
 * Get status label for display
 */
export function getStatusLabel(status: InviteStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'claimed':
      return 'Claimed';
    case 'expired':
      return 'Expired';
  }
}

/**
 * Convert API response to display-friendly format
 */
export function mapInviteToDisplay(
  invite: InviteResponse
): InviteDisplayData {
  const expiresAt = invite.expiresAt ? new Date(invite.expiresAt) : null;
  const claimedAt = invite.claimedAt ? new Date(invite.claimedAt) : null;

  let status: InviteStatus;
  if (invite.isExpired) {
    status = 'expired';
  } else if (invite.isClaimed && invite.isSingleUse) {
    status = 'claimed';
  } else {
    status = 'active';
  }

  // Fix the invite URL - replace backend URL with frontend URL
  let fixedUrl = invite.inviteUrl;
  if (typeof window !== 'undefined') {
    // Backend sends: http://localhost:8080/invites/{token}/claim
    // We need: http://localhost:3000/invites/{token}/claim
    // Just extract the token from the URL
    const tokenMatch = invite.inviteUrl.match(/\/invites\/([^/]+)\/claim/);
    if (tokenMatch && tokenMatch[1]) {
      const token = tokenMatch[1];
      // Build frontend URL
      fixedUrl = `${window.location.origin}/invites/${token}/claim`;
    }
  }

  return {
    id: invite.id,
    url: fixedUrl,
    status,
    createdAt: new Date(invite.createdAt),
    expiresAt,
    claimedAt,
    isSingleUse: invite.isSingleUse,
    expiryLabel: getExpiryLabel(expiresAt, invite.isExpired),
    statusLabel: getStatusLabel(status),
  };
}

/**
 * Truncate URL for display - show only the important token part
 */
export function truncateUrl(url: string, maxLength: number = 40): string {
  if (url.length <= maxLength) return url;
  
  // Extract the token part after /claim/
  const claimIndex = url.indexOf('/claim/');
  if (claimIndex !== -1) {
    const token = url.substring(claimIndex + 7); // 7 = length of '/claim/'
    if (token.length <= maxLength) {
      return `...${token}`;
    }
    // Show start and end of token
    const start = token.substring(0, 8);
    const end = token.substring(token.length - 8);
    return `...${start}...${end}`;
  }
  
  // Fallback: show end of URL
  return `...${url.substring(url.length - maxLength)}`;
}
