import { useState } from 'react'
import { CredentialDashboard } from '@/components/credential/CredentialDashboard'
import { CredentialModal } from '@/components/credential/CredentialModal'
import { CredentialTypeSelector } from '@/components/credential/CredentialTypeSelector'
import { useCredentialStore } from '@/stores'
import { Credential, CredentialType } from '@/types'

export function CredentialsPage() {
  const { credentialTypes } = useCredentialStore()
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null)
  const [selectedCredentialType, setSelectedCredentialType] = useState<CredentialType | null>(null)

  const handleCreateCredential = () => {
    setEditingCredential(null)
    setSelectedCredentialType(null)
    setShowTypeSelector(true)
  }

  const handleTypeSelected = (credentialType: CredentialType) => {
    setSelectedCredentialType(credentialType)
    setShowTypeSelector(false)
    setShowCreateModal(true)
  }

  const handleEditCredential = (credential: Credential) => {
    const credentialType = credentialTypes.find(ct => ct.name === credential.type)
    if (credentialType) {
      setEditingCredential(credential)
      setSelectedCredentialType(credentialType)
      setShowCreateModal(true)
    }
  }

  const handleCloseTypeSelector = () => {
    setShowTypeSelector(false)
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingCredential(null)
    setSelectedCredentialType(null)
  }

  const handleSaveCredential = (_credential: Credential) => {
    handleCloseModal()
    // The store will be updated by the modal component
  }

  return (
    <div className="min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CredentialDashboard
          onCreateCredential={handleCreateCredential}
          onEditCredential={handleEditCredential}
        />
      </div>

      {/* Type Selector Modal */}
      {showTypeSelector && (
        <CredentialTypeSelector
          onSelect={handleTypeSelected}
          onClose={handleCloseTypeSelector}
        />
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && selectedCredentialType && (
        <CredentialModal
          credentialType={selectedCredentialType}
          credential={editingCredential || undefined}
          onClose={handleCloseModal}
          onSave={handleSaveCredential}
        />
      )}
    </div>
  )
}