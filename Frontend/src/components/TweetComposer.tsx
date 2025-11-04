import { type FormEvent, useState, useRef } from 'react'
import { addTweet } from '../store-mongodb'
import apiService from '../services/api'

export default function TweetComposer() {
  const [text, setText] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB')
        return
      }
      setSelectedImage(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function handleRemoveImage() {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    console.log('TweetComposer - text:', text, 'trimmed:', trimmed, 'image:', selectedImage)
    
    if (!trimmed && !selectedImage) return
    
    setIsUploading(true)
    
    try {
      let imageUrl: string | undefined
      
      // Upload image if selected
      if (selectedImage) {
        try {
          imageUrl = await apiService.uploadImage(selectedImage)
          console.log('Image uploaded:', imageUrl)
        } catch (error) {
          console.error('Failed to upload image:', error)
          alert('Failed to upload image. Please try again.')
          setIsUploading(false)
          return
        }
      }
      
      // Create tweet with text and/or image
      await addTweet(trimmed || '', imageUrl)
      
      // Reset form
      setText('')
      setSelectedImage(null)
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error('Failed to post tweet:', err)
      alert(err instanceof Error ? err.message : 'Failed to post tweet')
    } finally {
      setIsUploading(false)
    }
  }


  return (
    <div className="card card-elevated animate-fade-in" style={{ 
      padding: '24px',
      marginBottom: '24px',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)'
    }}>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          {/* Avatar */}
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '50%', 
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '700',
            fontSize: '18px',
            flexShrink: 0
          }}>
            U
          </div>

          <div style={{ flex: 1 }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's happening?"
              rows={3}
              className="input"
              style={{ 
                resize: 'none',
                fontSize: '18px',
                lineHeight: '1.5',
                border: 'none',
                background: 'transparent',
                padding: '0',
                minHeight: '80px'
              }}
            />
            
            {/* Image Preview */}
            {imagePreview && (
              <div style={{
                marginTop: '16px',
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid var(--border)'
              }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    width: '100%',
                    maxHeight: '400px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)'
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          paddingTop: '16px',
          borderTop: '1px solid var(--border)',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            flex: '1',
            minWidth: '200px'
          }}>
            {/* Image Upload Button */}
            <label
              htmlFor="image-upload"
              style={{
                cursor: 'pointer',
                padding: '10px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s ease',
                color: 'var(--accent)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <input
                ref={fileInputRef}
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: '24px' }}>📷</span>
            </label>
            
            <div style={{ 
              fontSize: '12px', 
              color: 'var(--text-muted)',
              fontWeight: '500'
            }}>
              {text.length}/280
            </div>
          </div>
          <button 
            type="submit" 
            disabled={(!text.trim() && !selectedImage) || isUploading} 
            className="btn btn-primary hover-glow"
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '700',
              borderRadius: 'var(--radius-xl)',
              minWidth: '100px',
              flexShrink: 0,
              opacity: (!text.trim() && !selectedImage) || isUploading ? 0.6 : 1,
              cursor: (!text.trim() && !selectedImage) || isUploading ? 'not-allowed' : 'pointer'
            }}
          >
            {isUploading ? 'Uploading...' : 'Tweet'}
          </button>
        </div>
      </form>
    </div>
  )
}

