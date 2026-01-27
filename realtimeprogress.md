Real-Time Progress for Bulk Image Parsing                                                                                                                                     
                                                                                                                                                                               
 Problem                                                                                                                                                                       
                                                                                                                                                                               
 When parsing multiple images (e.g., 10 images), the UI shows "Parsing 0 of 10 images..." until all complete, then jumps to "Parsing 10 of 10". Users cannot see:              
 - Which images are currently being processed                                                                                                                                  
 - Which images have completed successfully                                                                                                                                    
 - Real-time progress as each image finishes                                                                                                                                   
                                                                                                                                                                               
 Root Cause                                                                                                                                                                    
                                                                                                                                                                               
 The current implementation uses a blocking POST request to /api/admin/questions/parse-batch:                                                                                  
 - All images start as 'pending' status                                                                                                                                        
 - API processes 3 images concurrently but returns results only when ALL complete                                                                                              
 - UI updates all statuses simultaneously when response arrives                                                                                                                
 - The 'parsing' status exists in types but is never used                                                                                                                      
                                                                                                                                                                               
 Solution: Server-Sent Events (SSE) Streaming                                                                                                                                  
                                                                                                                                                                               
 Implement SSE to stream progress updates as each image completes:                                                                                                             
 - Individual image updates: Each image transitions pending → parsing → success/error                                                                                          
 - Active indicators: Up to 3 images show spinning loader (actively processing)                                                                                                
 - Cancellation: User can stop parsing midway, keep already-parsed results                                                                                                     
 - Fallback: Keep existing blocking API as fallback if SSE fails                                                                                                               
                                                                                                                                                                               
 ---                                                                                                                                                                           
 Implementation Plan                                                                                                                                                           
                                                                                                                                                                               
 Phase 1: Create SSE Streaming Endpoint                                                                                                                                        
                                                                                                                                                                               
 New file: src/app/api/admin/questions/parse-batch/stream/route.ts                                                                                                             
                                                                                                                                                                               
 Create a new SSE endpoint that:                                                                                                                                               
 1. Returns text/event-stream response with ReadableStream                                                                                                                     
 2. Sends events: start, progress, complete, cancelled, error                                                                                                                  
 3. Uses modified concurrency processor that emits events as each image processes                                                                                              
 4. Respects AbortSignal for cancellation                                                                                                                                      
                                                                                                                                                                               
 Event format:                                                                                                                                                                 
 // Start event                                                                                                                                                                
 event: start                                                                                                                                                                  
 data: {"sessionId":"...", "totalImages":10, "concurrency":3}                                                                                                                  
                                                                                                                                                                               
 // Progress event (sent when image starts AND when it completes)                                                                                                              
 event: progress                                                                                                                                                               
 data: {"id":"img-1", "status":"parsing", "completed":0, "total":10}                                                                                                           
                                                                                                                                                                               
 event: progress                                                                                                                                                               
 data: {"id":"img-1", "status":"success", "question":{...}, "completed":1, "total":10}                                                                                         
                                                                                                                                                                               
 // Complete event (all done)                                                                                                                                                  
 event: complete                                                                                                                                                               
 data: {"successCount":8, "errorCount":2, "results":[...]}                                                                                                                     
                                                                                                                                                                               
 Key implementation details:                                                                                                                                                   
 - Extract parseImageWithRetry from existing batch route (reuse logic)                                                                                                         
 - Create processWithConcurrencyAndProgress that:                                                                                                                              
   - Sends progress event with status:'parsing' when worker picks up an image                                                                                                  
   - Calls parseImageWithRetry for the image                                                                                                                                   
   - Sends progress event with status:'success'/'error' when complete                                                                                                          
   - Checks request.signal.aborted and throws AbortError if cancelled                                                                                                          
 - Use ReadableStream with TextEncoder to format SSE messages                                                                                                                  
                                                                                                                                                                               
 ---                                                                                                                                                                           
 Phase 2: Create Client-Side SSE Hook                                                                                                                                          
                                                                                                                                                                               
 New file: src/hooks/use-sse-parser.ts                                                                                                                                         
                                                                                                                                                                               
 Custom hook that manages SSE connection:                                                                                                                                      
                                                                                                                                                                               
 interface UseSSEParserOptions {                                                                                                                                               
   onProgress: (imageId: string, status: 'parsing' | 'success' | 'error', data?: any) => void;                                                                                 
   onComplete: (results: BulkParseResult[]) => void;                                                                                                                           
   onError: (error: string) => void;                                                                                                                                           
 }                                                                                                                                                                             
                                                                                                                                                                               
 export function useSSEParser({ onProgress, onComplete, onError }) {                                                                                                           
   const startParsing = async (images: ImageParseItem[], authToken: string) => {                                                                                               
     // Make fetch request with POST body                                                                                                                                      
     // Parse SSE stream with ReadableStream reader                                                                                                                            
     // Handle each event type and call appropriate callback                                                                                                                   
   }                                                                                                                                                                           
                                                                                                                                                                               
   const cancelParsing = () => {                                                                                                                                               
     // Abort fetch with AbortController                                                                                                                                       
   }                                                                                                                                                                           
                                                                                                                                                                               
   return { startParsing, cancelParsing, isParsing, isConnected };                                                                                                             
 }                                                                                                                                                                             
                                                                                                                                                                               
 Features:                                                                                                                                                                     
 - Parse SSE events from ReadableStream (not EventSource, which doesn't support POST)                                                                                          
 - Buffer incomplete messages                                                                                                                                                  
 - Handle connection errors with retry (max 1 retry)                                                                                                                           
 - Use AbortController for cancellation                                                                                                                                        
 - Throw error for fallback to blocking API if connection fails                                                                                                                
                                                                                                                                                                               
 ---                                                                                                                                                                           
 Phase 3: Integrate SSE in UI                                                                                                                                                  
                                                                                                                                                                               
 Modify: src/views/admin/BulkImageImportPage.tsx                                                                                                                               
                                                                                                                                                                               
 1. Add SSE hook:                                                                                                                                                              
 const { startParsing, cancelParsing, isParsing } = useSSEParser({                                                                                                             
   onProgress: (imageId, status, data) => {                                                                                                                                    
     setImages(prev => prev.map(img => {                                                                                                                                       
       if (img.id === imageId) {                                                                                                                                               
         if (status === 'parsing') return { ...img, status: 'parsing' };                                                                                                       
         if (status === 'success') return { ...img, status: 'success', parsedQuestion: data.question };                                                                        
         if (status === 'error') return { ...img, status: 'error', error: data.error };                                                                                        
       }                                                                                                                                                                       
       return img;                                                                                                                                                             
     }));                                                                                                                                                                      
   },                                                                                                                                                                          
   onComplete: (results) => console.log('Done'),                                                                                                                               
   onError: (error) => setError(error)                                                                                                                                         
 });                                                                                                                                                                           
 2. Modify handleStartParsing:                                                                                                                                                 
   - Try SSE first: await startParsing(images, authToken)                                                                                                                      
   - If SSE fails (throws error): Fall back to existing blocking API                                                                                                           
   - Keep existing blocking implementation as handleStartParsingBlocking                                                                                                       
 3. Add cancel button in parsing step:                                                                                                                                         
 {isParsing && (                                                                                                                                                               
   <Button variant="outline" onClick={handleCancelParsing}>                                                                                                                    
     <XCircle className="w-4 h-4" /> Cancel                                                                                                                                    
   </Button>                                                                                                                                                                   
 )}                                                                                                                                                                            
 4. Implement handleCancelParsing:                                                                                                                                             
 const handleCancelParsing = () => {                                                                                                                                           
   cancelParsing(); // Abort SSE connection                                                                                                                                    
   setImages(prev => prev.map(img => {                                                                                                                                         
     if (img.status === 'pending' || img.status === 'parsing') {                                                                                                               
       return { ...img, status: 'error', error: 'Cancelled by user' };                                                                                                         
     }                                                                                                                                                                         
     return img; // Keep successful results                                                                                                                                    
   }));                                                                                                                                                                        
 };                                                                                                                                                                            
                                                                                                                                                                               
 Modify: src/components/admin/ImageParseProgress.tsx                                                                                                                           
                                                                                                                                                                               
 - Verify 'parsing' status shows spinning loader with ring effect (already implemented at line 44)                                                                             
 - Should work as-is, but test that up to 3 images show spinner simultaneously                                                                                                 
                                                                                                                                                                               
 ---                                                                                                                                                                           
 Phase 4: Add Type Definitions                                                                                                                                                 
                                                                                                                                                                               
 Modify: src/types/index.ts                                                                                                                                                    
                                                                                                                                                                               
 Add SSE event types:                                                                                                                                                          
 export interface SSEStartEvent {                                                                                                                                              
   sessionId: string;                                                                                                                                                          
   totalImages: number;                                                                                                                                                        
   concurrency: number;                                                                                                                                                        
 }                                                                                                                                                                             
                                                                                                                                                                               
 export interface SSEProgressEvent {                                                                                                                                           
   id: string;                                                                                                                                                                 
   status: 'parsing' | 'success' | 'error';                                                                                                                                    
   question?: ParsedImageQuestion;                                                                                                                                             
   error?: string;                                                                                                                                                             
   completed: number;                                                                                                                                                          
   total: number;                                                                                                                                                              
 }                                                                                                                                                                             
                                                                                                                                                                               
 export interface SSECompleteEvent {                                                                                                                                           
   successCount: number;                                                                                                                                                       
   errorCount: number;                                                                                                                                                         
   results: BulkParseResult[];                                                                                                                                                 
 }                                                                                                                                                                             
                                                                                                                                                                               
 export interface SSEErrorEvent {                                                                                                                                              
   message: string;                                                                                                                                                            
 }                                                                                                                                                                             
                                                                                                                                                                               
 ---                                                                                                                                                                           
 Critical Files                                                                                                                                                                
                                                                                                                                                                               
 1. NEW: src/app/api/admin/questions/parse-batch/stream/route.ts                                                                                                               
   - SSE endpoint with ReadableStream                                                                                                                                          
   - Modified concurrency processor with progress events                                                                                                                       
 2. NEW: src/hooks/use-sse-parser.ts                                                                                                                                           
   - SSE connection management                                                                                                                                                 
   - Event parsing and callbacks                                                                                                                                               
   - Cancellation and retry logic                                                                                                                                              
 3. MODIFY: src/views/admin/BulkImageImportPage.tsx                                                                                                                            
   - Line 57: handleStartParsing() - integrate SSE hook                                                                                                                        
   - Add cancel button to parsing step UI                                                                                                                                      
   - Add handleCancelParsing() function                                                                                                                                        
   - Extract blocking API to fallback function                                                                                                                                 
 4. MODIFY: src/components/admin/ImageParseProgress.tsx                                                                                                                        
   - Verify 'parsing' status styling (should work as-is)                                                                                                                       
 5. MODIFY: src/types/index.ts                                                                                                                                                 
   - Add SSE event type definitions                                                                                                                                            
                                                                                                                                                                               
 ---                                                                                                                                                                           
 Error Handling Strategy                                                                                                                                                       
                                                                                                                                                                               
 1. SSE connection fails initially: Fall back to blocking API immediately                                                                                                      
 2. SSE disconnects mid-stream: Retry once, then fall back to blocking API                                                                                                     
 3. Individual image parse fails: Continue processing other images, mark failed image as error                                                                                 
 4. User cancels: Abort fetch, mark pending/parsing images as "Cancelled by user"                                                                                              
 5. OpenAI rate limit: Existing retry logic in parseImageWithRetry handles this                                                                                                
                                                                                                                                                                               
 ---                                                                                                                                                                           
 Verification Steps                                                                                                                                                            
                                                                                                                                                                               
 1. Test Real-Time Progress                                                                                                                                                    
                                                                                                                                                                               
 - Upload 10 images                                                                                                                                                            
 - Observe:                                                                                                                                                                    
   - Progress header updates: "Parsing 1 of 10...", "Parsing 2 of 10...", etc.                                                                                                 
   - Up to 3 images show spinning loader at any moment (actively parsing)                                                                                                      
   - As each completes, spinner changes to checkmark (success) or X (error)                                                                                                    
   - Progress bar advances smoothly                                                                                                                                            
                                                                                                                                                                               
 2. Test Cancellation                                                                                                                                                          
                                                                                                                                                                               
 - Upload 10 images, start parsing                                                                                                                                             
 - After 3-4 complete, click "Cancel" button                                                                                                                                   
 - Verify:                                                                                                                                                                     
   - Parsing stops immediately                                                                                                                                                 
   - Completed images retain success/error status                                                                                                                              
   - Remaining images marked as "Cancelled by user" error                                                                                                                      
   - Can click "Retry Failed Images" to resume cancelled ones                                                                                                                  
                                                                                                                                                                               
 3. Test Fallback                                                                                                                                                              
                                                                                                                                                                               
 - Simulate SSE failure (disconnect network during connection)                                                                                                                 
 - Verify:                                                                                                                                                                     
   - UI falls back to existing blocking API                                                                                                                                    
   - All images parse successfully (without real-time updates)                                                                                                                 
   - No errors shown to user                                                                                                                                                   
                                                                                                                                                                               
 4. Test Browser Refresh                                                                                                                                                       
                                                                                                                                                                               
 - Start parsing 10 images                                                                                                                                                     
 - Refresh browser midway                                                                                                                                                      
 - Verify:                                                                                                                                                                     
   - localStorage warning appears (existing behavior)                                                                                                                          
   - Or: Images must be re-uploaded (acceptable)                                                                                                                               
                                                                                                                                                                               
 5. Test with Various Counts                                                                                                                                                   
                                                                                                                                                                               
 - Test with: 1 image, 5 images, 20 images, 50 images (max)                                                                                                                    
 - Verify performance and UI responsiveness                                                                                                                                    
                                                                                                                                                                               
 6. Manual Network Testing                                                                                                                                                     
                                                                                                                                                                               
 - Use Chrome DevTools → Network → Throttling → "Slow 3G"                                                                                                                      
 - Verify SSE connection remains stable                                                                                                                                        
 - Verify retry logic on temporary failures                                                                                                                                    
                                                                                                                                                                               
 ---                                                                                                                                                                           
 Implementation Notes                                                                                                                                                          
                                                                                                                                                                               
 SSE vs EventSource                                                                                                                                                            
                                                                                                                                                                               
 - Cannot use EventSource API (doesn't support POST or custom headers)                                                                                                         
 - Must use fetch() with ReadableStream and manual SSE parsing                                                                                                                 
 - Event format: event: <type>\ndata: <json>\n\n                                                                                                                               
                                                                                                                                                                               
 Concurrency Tracking                                                                                                                                                          
                                                                                                                                                                               
 - Track actively parsing images in a Set                                                                                                                                      
 - When worker picks up image: activelyParsing.add(id) + send 'parsing' event                                                                                                  
 - When worker completes: activelyParsing.delete(id) + send 'success/error' event                                                                                              
 - This ensures exactly 3 images show "parsing" status at a time                                                                                                               
                                                                                                                                                                               
 localStorage Persistence                                                                                                                                                      
                                                                                                                                                                               
 - Keep existing localStorage for step/images/error                                                                                                                            
 - Don't save dataUrl (too large)                                                                                                                                              
 - On refresh during parsing: Show warning that progress will be lost                                                                                                          
                                                                                                                                                                               
 Backward Compatibility                                                                                                                                                        
                                                                                                                                                                               
 - Keep existing /api/admin/questions/parse-batch endpoint unchanged                                                                                                           
 - Used as fallback when SSE fails                                                                                                                                             
 - Can be removed after SSE is stable in production                                                                                                                            
                                                                                                                                                                               
 ---                                                                                                                                                                           
 Out of Scope (Future Enhancements)                                                                                                                                            
                                                                                                                                                                               
 - Session-based job tracking (parse continues if tab closed)                                                                                                                  
 - Queue system for concurrent users                                                                                                                                           
 - WebSocket bidirectional communication                                                                                                                                       
 - Optimistic updates (mark as parsing before server confirms)     