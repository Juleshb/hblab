# Modal & Loader Components Guide

## Overview

This guide documents the Irembo-inspired modal and loader components designed for HB-LAB. These components provide a professional, government portal-style user experience with modern animations and accessibility features.

## Components

### 1. LoadingSpinner Component

The main loading spinner component with multiple variants and configurations.

#### Basic Usage
```jsx
import { LoadingSpinner } from './components/LoadingSpinner';

// Basic usage
<LoadingSpinner />

// With custom message
<LoadingSpinner message="Processing your request..." />

// With custom size
<LoadingSpinner size="medium" message="Loading data..." />
```

#### Props
- `message` (string): Custom loading message (default: "Loading, please wait…")
- `size` (string): Size variant - "small", "medium", "large" (default: "large")

#### Variants

##### InlineSpinner
For smaller contexts like buttons or inline elements.

```jsx
import { InlineSpinner } from './components/LoadingSpinner';

<InlineSpinner size="medium" className="mr-2" />
```

##### ButtonSpinner
Specifically designed for buttons with loading states.

```jsx
import { ButtonSpinner } from './components/LoadingSpinner';

<button className="btn btn-primary">
  <ButtonSpinner size="small" />
  Processing...
</button>
```

##### PageSpinner
Full-page loading experience with progress indicators.

```jsx
import { PageSpinner } from './components/LoadingSpinner';

<PageSpinner 
  title="Loading Application" 
  subtitle="Please wait while we prepare your dashboard"
/>
```

### 2. ClientModal Component

The main modal component with multiple types and configurations.

#### Basic Usage
```jsx
import { ClientModal } from './components/ClientModal';

<ClientModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Modal Title"
  subtitle="Modal subtitle"
  type="info"
  size="medium"
>
  <p>Modal content goes here</p>
</ClientModal>
```

#### Props
- `isOpen` (boolean): Controls modal visibility
- `onClose` (function): Function called when modal should close
- `title` (string): Modal title
- `subtitle` (string, optional): Modal subtitle
- `type` (string): Modal type - "info", "success", "warning", "error", "form"
- `size` (string): Modal size - "small", "medium", "large", "full"
- `showCloseButton` (boolean): Show close button (default: true)
- `closeOnBackdrop` (boolean): Close on backdrop click (default: true)
- `closeOnEscape` (boolean): Close on escape key (default: true)
- `loading` (boolean): Show loading overlay
- `actions` (ReactNode): Custom action buttons

#### Modal Types

##### InfoModal
For informational content with blue color scheme.

```jsx
import { InfoModal } from './components/ClientModal';

<InfoModal
  isOpen={showInfo}
  onClose={() => setShowInfo(false)}
  title="Information"
  subtitle="This is an informational modal"
>
  <p>Helpful information for users</p>
</InfoModal>
```

##### SuccessModal
For success messages with green color scheme.

```jsx
import { SuccessModal } from './components/ClientModal';

<SuccessModal
  isOpen={showSuccess}
  onClose={() => setShowSuccess(false)}
  title="Success!"
  subtitle="Operation completed successfully"
>
  <p>Your action was completed successfully</p>
</SuccessModal>
```

##### WarningModal
For warnings with yellow color scheme.

```jsx
import { WarningModal } from './components/ClientModal';

<WarningModal
  isOpen={showWarning}
  onClose={() => setShowWarning(false)}
  title="Warning"
  subtitle="Please review this information"
>
  <p>This action may have consequences</p>
</WarningModal>
```

##### ErrorModal
For error messages with red color scheme.

```jsx
import { ErrorModal } from './components/ClientModal';

<ErrorModal
  isOpen={showError}
  onClose={() => setShowError(false)}
  title="Error Occurred"
  subtitle="Something went wrong"
>
  <p>An error has occurred while processing your request</p>
</ErrorModal>
```

##### FormModal
For forms with purple color scheme.

```jsx
import { FormModal } from './components/ClientModal';

<FormModal
  isOpen={showForm}
  onClose={() => setShowForm(false)}
  title="Contact Form"
  subtitle="Send us a message"
  size="large"
>
  <form className="space-y-4">
    <input type="text" placeholder="Name" />
    <input type="email" placeholder="Email" />
    <textarea placeholder="Message"></textarea>
  </form>
</FormModal>
```

##### ConfirmationModal
For confirming important actions.

```jsx
import { ConfirmationModal } from './components/ClientModal';

<ConfirmationModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  title="Confirm Action"
  message="Are you sure you want to delete this item?"
  confirmText="Delete"
  cancelText="Cancel"
  type="warning"
  onConfirm={handleDelete}
/>
```

## Design Principles

### 1. Government Portal Aesthetics
- Professional color schemes
- Clean, modern typography
- Consistent spacing and layout
- Government-style gradients and patterns

### 2. Accessibility
- Keyboard navigation support (Escape key)
- Screen reader friendly
- High contrast ratios
- Focus management

### 3. User Experience
- Smooth animations and transitions
- Loading states for async operations
- Clear visual feedback
- Intuitive interaction patterns

### 4. Responsive Design
- Mobile-first approach
- Adaptive sizing
- Touch-friendly interactions
- Flexible layouts

## Usage Examples

### Login Form with Error Handling
```jsx
import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorModal } from './ClientModal';

const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Login logic here
      await loginUser(credentials);
    } catch (error) {
      setErrorMessage(error.message);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Signing you in..." />;
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
      </form>

      <ErrorModal
        isOpen={showError}
        onClose={() => setShowError(false)}
        title="Login Failed"
        subtitle={errorMessage}
      >
        <div className="text-center py-4">
          <p className="text-gray-700 mb-6">
            Please check your credentials and try again.
          </p>
          <button
            onClick={() => setShowError(false)}
            className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl"
          >
            Try Again
          </button>
        </div>
      </ErrorModal>
    </>
  );
};
```

### Contact Form with Success Feedback
```jsx
import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { SuccessModal } from './ClientModal';

const ContactForm = () => {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await sendMessage(formData);
      setShowSuccess(true);
      // Clear form
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Sending your message..." />;
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
      </form>

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Message Sent Successfully!"
        subtitle="Thank you for contacting us"
      >
        <div className="text-center py-4">
          <p className="text-gray-700 mb-6">
            We've received your message and will get back to you within 24 hours.
          </p>
          <button
            onClick={() => setShowSuccess(false)}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl"
          >
            Thank You
          </button>
        </div>
      </SuccessModal>
    </>
  );
};
```

### Confirmation Dialog
```jsx
import React, { useState } from 'react';
import { ConfirmationModal } from './ClientModal';

const DeleteButton = ({ itemId, onDelete }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onDelete(itemId);
      setShowConfirm(false);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-4 py-2 bg-red-600 text-white rounded-lg"
      >
        Delete Item
      </button>

      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Deletion"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="error"
        onConfirm={handleConfirm}
        loading={loading}
      />
    </>
  );
};
```

## Demo Page

Visit `/modal-demo` to see all components in action with interactive examples.

## Styling

All components use Tailwind CSS classes and are designed to work with the existing HB-LAB design system. The components include:

- Consistent color schemes
- Modern gradients
- Smooth animations
- Responsive design
- Accessibility features

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers
- Screen readers
- Keyboard navigation

## Performance

- Optimized animations
- Minimal bundle size
- Efficient re-renders
- Lazy loading support

## Contributing

When adding new modal types or loader variants:

1. Follow the existing design patterns
2. Maintain accessibility standards
3. Add proper TypeScript types
4. Include usage examples
5. Update this documentation

## Troubleshooting

### Common Issues

1. **Modal not closing**: Ensure `onClose` function is properly passed
2. **Loading spinner not showing**: Check if `loading` prop is set to `true`
3. **Styling conflicts**: Verify Tailwind CSS is properly configured
4. **Accessibility issues**: Test with screen readers and keyboard navigation

### Best Practices

1. Always provide meaningful titles and subtitles
2. Use appropriate modal types for different scenarios
3. Include loading states for async operations
4. Test on different screen sizes
5. Ensure proper error handling 