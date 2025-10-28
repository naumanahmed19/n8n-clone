import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Credential, CredentialType } from '@/types'
import { Key } from 'lucide-react'
import { CredentialForm } from './CredentialForm'

interface CredentialModalProps {
  open: boolean
  credentialType: CredentialType
  credential?: Credential
  onClose: () => void
  onSave: (credential: Credential) => void
}

export function CredentialModal({
  open,
  credentialType,
  credential,
  onClose,
  onSave
}: CredentialModalProps) {

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: credentialType.color || '#6B7280' }}
            >
              {credentialType.icon || <Key className="w-4 h-4" />}
            </div>
            <div>
              <DialogTitle>
                {credential ? 'Edit' : 'Create'} {credentialType.displayName}
              </DialogTitle>
              <DialogDescription>
                {credentialType.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Form */}
        <div className="overflow-y-auto max-h-[60vh] px-1">
          <CredentialForm
            credentialType={credentialType}
            credential={credential}
            onSuccess={onSave}
            onCancel={onClose}
            showHeader={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
