# Groq-Only Configuration Changes

This document outlines the changes made to disable the load balancing system and force the application to use only Groq as the AI provider.

## Overview

The AI4CEO chat application previously supported load balancing between OpenRouter and Groq providers. Due to issues with OpenRouter taking control inappropriately, the system has been modified to use **Groq exclusively** while preserving the OpenRouter integration code for potential future restoration.

## Files Modified

### Core Provider Logic

#### `lib/ai/providers.ts`
- **Main Changes:**
  - Commented out OpenRouter provider initialization
  - Modified `myProvider` to use Groq models only
  - Updated `getLanguageModelForId()` to use Groq mapping instead of OpenRouter
  - Modified `getDynamicLanguageModelForId()` to use `modelOverridesGroq` instead of `modelOverrides`
  - Completely rewrote `resolveModelCandidatesForId()` to return only Groq candidates
  - Added error handling when Groq API key is not configured
  - Preserved original load balancing code in comments for future restoration

#### `app/api/chat/schema.ts`
- Changed default `selectedProviderPreference` from `'balance'` to `'groq'`

#### `app/api/chat/route.ts`
- Updated all `resolveModelCandidatesForId()` calls to use Groq-only parameters
- Removed OpenRouter override parameters
- Forced provider preference to `'groq'`

#### `app/(chat)/actions.ts`
- Updated `generateTitleFromUserMessage()` to use Groq-only configuration
- Removed OpenRouter override parameters

### Admin Interface

#### `components/admin/models-panel.client.tsx`
- **Complete UI Overhaul:**
  - Hidden OpenRouter sections completely
  - Improved layout with better card-based design
  - Added Groq-only status indicator
  - Removed OpenRouter model fetching and configuration
  - Updated default mappings to use Groq models
  - Enhanced visual hierarchy and spacing
  - Added clear section headings and descriptions
  - Forced provider preference to save as `'groq'`

#### `app/admin/layout.tsx`
- Completely redesigned admin dashboard layout
- Added modern card-based sidebar design
- Improved responsive grid layout
- Added user info display in sidebar
- Enhanced visual styling and spacing

#### `app/admin/page.tsx`
- Redesigned homepage with modern card layout
- Added platform overview metrics
- Created quick action cards for common tasks
- Added system status indicator showing Groq-only operation
- Improved visual hierarchy and information architecture

#### `app/admin/models/page.tsx`
- Updated to match new card-based design
- Enhanced page structure and layout

### UI Components

#### `components/provider-selector.tsx`
- **Completely Disabled:**
  - Removed dropdown functionality
  - Component now shows static "Groq Only" indicator
  - Automatically forces parent components to use `'groq'` preference
  - Added green status indicator dot
  - Simplified to single button display

## Model Mappings

### Groq Model Defaults
```javascript
{
  'chat-model': 'llama3-8b-8192',
  'chat-model-small': 'llama3-8b-8192', 
  'chat-model-large': 'llama3-70b-8192',
  'chat-model-reasoning': 'llama3-70b-8192',
  'title-model': 'llama3-8b-8192',
  'artifact-model': 'llama3-8b-8192'
}
```

### OpenRouter Models (Preserved for Reference)
The original OpenRouter model mappings are preserved in comments:
```javascript
// {
//   'chat-model': 'moonshotai/kimi-k2:free',
//   'chat-model-small': 'moonshotai/kimi-k2:free',
//   'chat-model-large': 'moonshotai/kimi-k2:free', 
//   'chat-model-reasoning': 'deepseek/deepseek-r1:free',
//   'title-model': 'meta-llama/llama-3.2-3b-instruct:free',
//   'artifact-model': 'moonshotai/kimi-k2:free'
// }
```

## Environment Requirements

### Required
- `GROQ_API_KEY` - Must be configured for the application to function

### Optional (Disabled)
- `OPENROUTER_API_KEY` - Not used but can remain in environment for future restoration

## API Endpoints

### Still Functional
- `/admin/api/models/groq` - Fetches available Groq models

### Disabled (Preserved)
- `/admin/api/models/openrouter` - Still exists but not called by UI

## User Experience Changes

1. **Admin Dashboard:**
   - Clean, modern card-based layout
   - Clear status indicators showing Groq-only operation
   - Simplified model configuration focused on Groq
   - Removed confusing provider selection options

2. **Provider Selection:**
   - No longer shows dropdown to users
   - Displays static "Groq Only" status with green indicator
   - All requests automatically use Groq

3. **Error Handling:**
   - Application will throw clear error if Groq API key is missing
   - Better error messages for Groq-related issues

## Restoration Path

To restore OpenRouter functionality in the future:

1. **Uncomment Code Sections:**
   - Uncomment OpenRouter provider initialization in `lib/ai/providers.ts`
   - Restore load balancing logic in `resolveModelCandidatesForId()`
   - Uncomment OpenRouter UI sections in admin panel

2. **Revert Component Changes:**
   - Restore `provider-selector.tsx` dropdown functionality
   - Re-enable OpenRouter model fetching in admin panel
   - Update default preferences back to `'balance'`

3. **Update API Calls:**
   - Restore OpenRouter override parameters in route handlers
   - Update schema defaults if desired

## Testing Recommendations

- Verify Groq API key is properly configured
- Test all chat functionality with various model types
- Ensure admin panel saves Groq model preferences correctly
- Confirm no OpenRouter calls are being made
- Validate error handling when Groq is unavailable

## Notes

- All OpenRouter code is preserved in comments for easy restoration
- Database schema unchanged - existing settings will continue to work
- No data migration required
- Changes are primarily configuration and UI-focused
- Backward compatible with existing chat history