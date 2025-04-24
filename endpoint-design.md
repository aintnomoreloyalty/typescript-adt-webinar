
The codebase follows a consistent API design pattern:

1. **POST-only RPC style**
   - Actions are expressed in URL paths
   - This simplifies client-server communication by using a single HTTP verb

2. **Result type pattern**
   - All operations return a `Result<T>` discriminated union type
   - Success variant: `success(value)` where value can be `none()` or `some(data)`
   - Error variant: `failure({ kind: 'error-type', ... })`
   - Error handling is part of the business logic, not HTTP layer

3. **HTTP 200 for everything**
   - Always returns HTTP 200 status code, even for errors
   - Error information is conveyed in the Result object
   - Client checks `result.kind === 'success'` to determine outcome

4. **Benefits**
   - Consistent API interface
   - Detailed error reporting with domain-specific error types
   - Simpler client handling (always expect 200 + Result object)
   - Easier to add new operations without changing client architecture

This approach treats HTTP as a transport layer only, with the API's semantic logic handled entirely through the Result type system.
