# UI Component Library Quick Reference

## Installation

All components are available from a single import:

```typescript
import { Button, Input, Select, Modal, Toast, ToastContainer, LoadingSpinner, LoadingOverlay, LoadingSkeleton } from './components/ui'
```

## Button Component

### Basic Usage
```tsx
<Button>Click Me</Button>
```

### Variants
```tsx
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>
<Button variant="success">Success</Button>
```

### Sizes
```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>  {/* default */}
<Button size="lg">Large</Button>
```

### With Icons
```tsx
import { Plus, Trash2 } from 'lucide-react'

<Button leftIcon={<Plus size={16} />}>Add Item</Button>
<Button rightIcon={<Trash2 size={16} />}>Delete</Button>
```

### Loading State
```tsx
<Button loading={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save'}
</Button>
```

### Full Example
```tsx
<Button 
  variant="primary" 
  size="lg" 
  loading={loading}
  disabled={disabled}
  onClick={handleClick}
  leftIcon={<Save size={16} />}
>
  Save Changes
</Button>
```

---

## Input Component

### Basic Usage
```tsx
<Input 
  label="Email" 
  value={email} 
  onChange={(e) => setEmail(e.target.value)} 
/>
```

### With Validation
```tsx
<Input 
  label="Password"
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  error={errors.password}
  required
/>
```

### With Help Text
```tsx
<Input 
  label="Username"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  helpText="Must be 3-20 characters"
/>
```

### With Icons
```tsx
import { Mail, DollarSign } from 'lucide-react'

<Input 
  label="Email"
  leftIcon={<Mail size={16} />}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

<Input 
  label="Price"
  type="number"
  leftIcon={<DollarSign size={16} />}
  value={price}
  onChange={(e) => setPrice(e.target.value)}
/>
```

### Full Example
```tsx
<Input 
  id="investment-name"
  label="Investment Name"
  type="text"
  value={name}
  onChange={(e) => setName(e.target.value)}
  placeholder="e.g., Apple Inc."
  error={errors.name}
  helpText="The full name of your investment"
  required
  disabled={isSubmitting}
  leftIcon={<Building size={16} />}
/>
```

---

## Select Component

### Basic Usage
```tsx
<Select 
  label="Country"
  value={country}
  onChange={(e) => setCountry(e.target.value)}
  options={[
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' }
  ]}
/>
```

### With Validation
```tsx
<Select 
  label="Investment Type"
  value={type}
  onChange={(e) => setType(e.target.value)}
  options={investmentTypes}
  error={errors.type}
  required
/>
```

### Full Example
```tsx
<Select 
  id="investment-type"
  label="Investment Type"
  value={type}
  onChange={(e) => setType(e.target.value)}
  options={[
    { value: 'stock', label: 'Stock - Individual companies' },
    { value: 'etf', label: 'ETF - Exchange-Traded Fund' },
    { value: 'bond', label: 'Bond - Fixed income' }
  ]}
  error={errors.type}
  helpText="Different types have different risk profiles"
  required
  disabled={isSubmitting}
/>
```

---

## Modal Component

### Basic Usage
```tsx
const [isOpen, setIsOpen] = useState(false)

<Modal 
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
>
  <p>Are you sure you want to proceed?</p>
</Modal>
```

### With Sizes
```tsx
<Modal size="sm">Small Modal</Modal>
<Modal size="md">Medium Modal</Modal>  {/* default */}
<Modal size="lg">Large Modal</Modal>
<Modal size="xl">Extra Large Modal</Modal>
```

### With Header and Footer
```tsx
<Modal 
  isOpen={isOpen}
  onClose={handleClose}
  title="Edit Investment"
  footer={
    <>
      <Button variant="secondary" onClick={handleClose}>Cancel</Button>
      <Button variant="primary" onClick={handleSave}>Save</Button>
    </>
  }
>
  <div>
    {/* Modal content */}
  </div>
</Modal>
```

---

## Toast Notifications

### Using the useToast Hook
```tsx
import { useToast } from '../hooks/useToast'
import { ToastContainer } from './components/ui'

function MyComponent() {
  const { toasts, success, error, warning, info } = useToast()
  
  const handleSave = () => {
    // ... save logic
    success('Investment saved successfully!')
  }
  
  const handleError = () => {
    error('Failed to save investment')
  }
  
  return (
    <>
      <Button onClick={handleSave}>Save</Button>
      <ToastContainer toasts={toasts} />
    </>
  )
}
```

### Toast Types
```tsx
const { success, error, warning, info, showToast } = useToast()

// Success (green)
success('Operation completed!')

// Error (red)
error('Something went wrong!')

// Warning (yellow)
warning('Please review your input')

// Info (blue)
info('New feature available')

// Custom toast
showToast('Custom message', 'success', 5000) // 5 second duration
```

---

## Loading Components

### LoadingSpinner
```tsx
<LoadingSpinner size="md" message="Loading data..." />
<LoadingSpinner size="lg" />
<LoadingSpinner size="sm" />
```

### LoadingOverlay
```tsx
{isLoading && <LoadingOverlay message="Saving changes..." />}
```

### LoadingSkeleton
```tsx
<LoadingSkeleton width="100%" height="20px" />
<LoadingSkeleton width="200px" height="40px" />
<LoadingSkeleton width="60%" height="16px" />
```

### Loading List Example
```tsx
{isLoading ? (
  <>
    <LoadingSkeleton height="80px" />
    <LoadingSkeleton height="80px" />
    <LoadingSkeleton height="80px" />
  </>
) : (
  items.map(item => <ItemCard key={item.id} item={item} />)
)}
```

---

## Error Boundary

### Wrap Your App
```tsx
import { ErrorBoundary } from './components/ErrorBoundary'

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### Custom Fallback
```tsx
<ErrorBoundary fallback={<CustomErrorUI />}>
  <MyComponent />
</ErrorBoundary>
```

---

## Form Example

Complete form using all components:

```tsx
import { useState } from 'react'
import { Button, Input, Select } from './components/ui'
import { useToast } from './hooks/useToast'
import { Save } from 'lucide-react'

function InvestmentForm() {
  const [formData, setFormData] = useState({ name: '', type: 'stock', amount: '' })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { success, error } = useToast()
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    const newErrors = {}
    if (!formData.name) newErrors.name = 'Required'
    if (!formData.amount) newErrors.amount = 'Required'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await saveInvestment(formData)
      success('Investment saved successfully!')
    } catch (err) {
      error('Failed to save investment')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <Input 
        label="Investment Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        required
        disabled={isSubmitting}
      />
      
      <Select 
        label="Type"
        value={formData.type}
        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        options={[
          { value: 'stock', label: 'Stock' },
          { value: 'etf', label: 'ETF' },
          { value: 'bond', label: 'Bond' }
        ]}
        required
        disabled={isSubmitting}
      />
      
      <Input 
        label="Amount"
        type="number"
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
        error={errors.amount}
        required
        disabled={isSubmitting}
      />
      
      <Button 
        type="submit" 
        variant="primary" 
        loading={isSubmitting}
        leftIcon={<Save size={16} />}
      >
        Save Investment
      </Button>
    </form>
  )
}
```

---

## Best Practices

### 1. Always Use Loading States
```tsx
// ✅ Good
<Button loading={isSubmitting}>Save</Button>

// ❌ Bad
<Button disabled={isSubmitting}>Save</Button>
```

### 2. Provide User Feedback
```tsx
// ✅ Good - Shows toast notification
const handleDelete = () => {
  deleteInvestment(id)
  success('Investment deleted!')
}

// ❌ Bad - No feedback
const handleDelete = () => {
  deleteInvestment(id)
}
```

### 3. Use Help Text
```tsx
// ✅ Good
<Input 
  label="Symbol"
  helpText="The trading ticker (e.g., AAPL)"
  value={symbol}
  onChange={...}
/>

// ❌ Bad
<Input label="Symbol" value={symbol} onChange={...} />
```

### 4. Clear Error Messages
```tsx
// ✅ Good - Concise
error="Required"

// ❌ Bad - Verbose
error="This field is required and must be filled out before submitting the form"
```

### 5. Disable During Operations
```tsx
// ✅ Good
<Input disabled={isSubmitting} />
<Button loading={isSubmitting}>Save</Button>

// ❌ Bad - User can interact during async operation
<Input />
<Button>Save</Button>
```

---

## Styling

All components use CSS variables for theming. Override by setting custom classes or inline styles:

```tsx
<Button className="my-custom-class">Custom</Button>
<Input style={{ maxWidth: '300px' }} />
```

Available CSS variables:
- `--color-primary` - Primary brand color
- `--color-secondary` - Secondary text color
- `--color-success` - Success/positive actions
- `--color-danger` - Danger/destructive actions
- `--color-warning` - Warning messages
- `--bg-base` - Base background
- `--bg-surface` - Raised surfaces
- `--bg-elevated` - Elevated elements (modals, cards)
- `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--spacing-xl` - Consistent spacing
- `--radius-sm`, `--radius-md`, `--radius-lg` - Border radius values

---

## TypeScript Support

All components are fully typed:

```tsx
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}
```

TypeScript will catch errors like:

```tsx
// ❌ Type error: 'danger' is not assignable to 'lg'
<Button size="danger">Click</Button>

// ✅ Correct
<Button variant="danger">Click</Button>
```
