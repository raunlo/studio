'use client';

import { useState } from 'react';
import { useGetTemplateInvites, useCreateTemplateInvite, revokeTemplateInvite } from '@/api/template/template';
import type { TemplateInviteResponse } from '@/api/checklistServiceV1.schemas';
import { copyToClipboard, getExpiryLabel, getStatusLabel, type InviteStatus, type InviteDisplayData } from '@/lib/invite-utils';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

interface ShareTemplateModalProps {
  templateId: number;
  templateName: string;
  isOpen: boolean;
  onClose: () => void;
}

type ExpiryOption = 'never' | '1day' | '7days' | '30days';

function mapTemplateInviteToDisplay(invite: TemplateInviteResponse): InviteDisplayData {
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

  let url = invite.inviteUrl;
  if (typeof window !== 'undefined') {
    url = `${window.location.origin}/template-invites/${invite.inviteToken}/claim`;
  }

  return {
    id: invite.id,
    url,
    status,
    createdAt: new Date(invite.createdAt),
    expiresAt,
    claimedAt,
    isSingleUse: invite.isSingleUse,
    expiryLabel: getExpiryLabel(expiresAt, invite.isExpired),
    statusLabel: getStatusLabel(status),
  };
}

export function ShareTemplateModal({
  templateId,
  templateName,
  isOpen,
  onClose,
}: ShareTemplateModalProps) {
  const { t } = useTranslation();
  const [selectedExpiry, setSelectedExpiry] = useState<ExpiryOption>('7days');
  const [isSingleUse, setIsSingleUse] = useState(true);
  const [inviteName, setInviteName] = useState('');
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const {
    data: invites = [],
    mutate: refreshInvites,
    isLoading,
  } = useGetTemplateInvites(templateId, {
    swr: { enabled: isOpen },
  });

  const { trigger: createInvite, isMutating: isCreating } = useCreateTemplateInvite(templateId);

  const displayInvites: InviteDisplayData[] = invites.map(mapTemplateInviteToDisplay);

  const handleGenerateLink = async () => {
    const expiryMap: Record<ExpiryOption, number | null> = {
      never: null,
      '1day': 24,
      '7days': 168,
      '30days': 720,
    };

    try {
      const result = await createInvite({
        name: inviteName.trim() || null,
        expiresInHours: expiryMap[selectedExpiry],
        isSingleUse,
      });

      if (result?.inviteToken) {
        const urlToCopy = `${window.location.origin}/template-invites/${result.inviteToken}/claim`;

        const success = await copyToClipboard(urlToCopy);
        if (success) {
          toast({
            title: t('share.inviteLinkCopied'),
            description: t('share.inviteLinkCopiedDescription'),
          });
        } else {
          toast({
            title: t('share.linkGenerated'),
            description: urlToCopy,
            variant: 'default',
          });
        }

        await refreshInvites();
        setInviteName('');
        setIsSingleUse(true);
        setSelectedExpiry('7days');
      }
    } catch (error: any) {
      toast({
        title: t('share.failedToGenerateInvite'),
        description: error?.message || t('common.somethingWentWrong'),
        variant: 'destructive',
      });
    }
  };

  const handleCopyLink = async (url: string) => {
    try {
      const success = await copyToClipboard(url);
      if (success) {
        toast({
          title: t('share.linkCopied'),
          description: t('share.pasteToShare'),
        });
      } else {
        toast({
          title: t('share.copyFailed'),
          description: url,
          duration: 10000,
        });
      }
    } catch (error) {
      console.error('Copy error:', error);
      toast({
        title: t('share.copyFailed'),
        description: url,
        duration: 10000,
      });
    }
  };

  const handleShare = async (url: string, inviteNameParam?: string | null) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${t('share.templateTitle', 'Share Template')}: ${templateName}`,
          text: inviteNameParam
            ? `${inviteNameParam} - ${t('share.shareMessage')}`
            : `${t('share.shareMessage')} "${templateName}"`,
          url,
        });
        toast({ title: t('share.sharedSuccessfully') });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
          await handleCopyLink(url);
        }
      }
    } else {
      await handleCopyLink(url);
    }
  };

  const handleRevoke = async (inviteId: number) => {
    if (!confirm(t('share.revokeConfirmation'))) return;

    setRevokingId(inviteId);
    try {
      await revokeTemplateInvite(inviteId);
      toast({ title: t('share.inviteRevoked') });
      await refreshInvites();
    } catch (error: any) {
      toast({
        title: t('share.failedToRevoke'),
        description: error?.message || t('common.somethingWentWrong'),
        variant: 'destructive',
      });
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="flex max-h-[95vh] flex-col gap-0 p-0 sm:max-h-[90vh]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="sticky top-0 z-10 border-b bg-background p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                {t('share.templateTitle', 'Share Template')} &quot;{templateName}&quot;
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {t('share.templateDescription', 'Create invite links to share this template with others')}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-6 p-4 sm:p-6">
            {/* Create New Invite Section */}
            <div className="space-y-4 rounded-lg border p-3 sm:p-4">
              <h3 className="text-sm font-semibold sm:text-base">
                {t('share.createNewInviteLink')}
              </h3>

              <div className="space-y-2">
                <Label htmlFor="invite-name" className="text-sm">
                  {t('share.nameOptional')}
                </Label>
                <Input
                  id="invite-name"
                  type="text"
                  placeholder={t('share.namePlaceholder')}
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  maxLength={100}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">{t('share.nameHelperText')}</p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="single-use"
                  checked={isSingleUse}
                  onCheckedChange={(checked) => setIsSingleUse(!!checked)}
                />
                <Label htmlFor="single-use" className="cursor-pointer text-sm">
                  {t('share.singleUseOnly')}
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry" className="text-sm">
                  {t('share.expiresIn')}
                </Label>
                <Select
                  value={selectedExpiry}
                  onValueChange={(value) => setSelectedExpiry(value as ExpiryOption)}
                >
                  <SelectTrigger id="expiry" className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">{t('share.expiryNever')}</SelectItem>
                    <SelectItem value="1day">{t('share.expiry1day')}</SelectItem>
                    <SelectItem value="7days">{t('share.expiry7days')}</SelectItem>
                    <SelectItem value="30days">{t('share.expiry30days')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleGenerateLink} disabled={isCreating} className="w-full text-sm">
                {isCreating ? t('share.generating') : t('share.generateInviteLink')}
              </Button>
            </div>

            {/* Active Invites Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold sm:text-base">
                {t('share.activeInvites')} ({displayInvites.length})
              </h3>

              {isLoading ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  {t('share.loadingInvites')}
                </div>
              ) : displayInvites.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t('share.noActiveInvites')}
                </div>
              ) : (
                <div className="space-y-3">
                  {displayInvites.map((invite) => {
                    const inviteData = invites.find((i) => i.id === invite.id);
                    return (
                      <div key={invite.id} className="space-y-3 rounded-lg border p-3 sm:p-4">
                        <div className="space-y-2">
                          {inviteData?.name && (
                            <div className="text-sm font-medium sm:text-base">
                              {inviteData.name}
                            </div>
                          )}
                          <div className="flex items-center gap-2 rounded bg-muted p-2">
                            <span className="shrink-0 text-xl">🔗</span>
                            <input
                              type="text"
                              readOnly
                              value={invite.url}
                              className="min-w-0 flex-1 cursor-text border-none bg-transparent font-mono text-xs outline-none"
                              onClick={(e) => e.currentTarget.select()}
                              title="Click to select"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground sm:gap-2">
                          <span>{invite.expiryLabel}</span>
                          <span>•</span>
                          <span>
                            {invite.isSingleUse ? t('share.singleUse') : t('share.reusable')}
                          </span>
                          {invite.claimedAt && (
                            <>
                              <span>•</span>
                              <span className="break-all">
                                {t('share.claimed')} {invite.claimedAt.toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {invite.status === 'active' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleShare(invite.url, inviteData?.name)}
                                className="text-xs sm:text-sm"
                              >
                                📤 {t('share.share')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyLink(invite.url)}
                                className="text-xs sm:text-sm"
                              >
                                {t('share.copyLink')}
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRevoke(invite.id)}
                            disabled={revokingId === invite.id}
                            className="text-xs sm:text-sm"
                          >
                            {revokingId === invite.id ? t('share.revoking') : t('share.revoke')}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end border-t bg-background p-4 sm:p-6">
            <Button variant="outline" onClick={onClose} className="text-sm">
              {t('common.close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
