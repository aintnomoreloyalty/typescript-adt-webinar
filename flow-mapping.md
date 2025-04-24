```mermaid
flowchart TD
    %% Improved style definitions with more distinct colors and shapes
    classDef input fill:#e0f7fa,stroke:#00838f,stroke-width:2px
    classDef result fill:#e0f7fa,stroke:#00838f,stroke-width:2px
    classDef success fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,fontColor:#2e7d32
    classDef failure fill:#ffebee,stroke:#c62828,stroke-width:2px,fontColor:#c62828
    classDef process fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef conditional fill:#fff8e1,stroke:#ff8f00,stroke-width:2px,fontColor:#ff8f00
    classDef endpoint fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px,fontColor:#6a1b9a
    classDef dberror fill:#ffcdd2,stroke:#c62828,stroke-width:2px,fontColor:#c62828
    classDef dboperation fill:#e1f5fe,stroke:#0277bd,stroke-width:2px

    %% Starting point
    Start(["Registration Request"]):::input --> RegistrationType{"Determine<br>Registration Type"}:::conditional

    %% EXTRACTED COMMON OPERATIONS
    
    %% Recaptcha Validation Operation
    subgraph RecaptchaValidationOp["Recaptcha Validation"]
        direction TB
        RecaptchaInput([" "]):::input --> RecaptchaValidationCore["Validate<br>reCAPTCHA"]:::process
        RecaptchaValidationCore --> RecaptchaValidationResultCore["Recaptcha Validation Result"]:::result
        RecaptchaValidationCore -.->|Failure| RecaptchaErrorCore["Recaptcha Error"]:::failure
        RecaptchaErrorCore -.-> RecaptchaValidationResultCore
        RecaptchaValidationResultCore --> RecaptchaOutput([" "]):::result
    end
    
    %% User Lookup Operation
    subgraph UserLookupOp["User Lookup Operation"]
        direction TB
        UserLookupInput([" "]):::input --> UserLookupCore["DB: Find<br>Existing User"]:::dboperation
        UserLookupCore --> UserLookupResultCore["User Lookup Result"]:::result
        UserLookupCore -.->|Failure: DB Error| UserLookupDBErrorCore["DB Error"]:::dberror
        UserLookupDBErrorCore -.-> UserLookupResultCore
        UserLookupResultCore --> UserLookupOutput([" "]):::result
    end
    
    %% Team Lookup by Slug Operation
    subgraph TeamSlugLookupOp["Team Lookup by Slug Operation"]
        direction TB
        TeamSlugInput([" "]):::input --> TeamSlugLookupCore["DB: Find<br>Team by Slug"]:::dboperation
        TeamSlugLookupCore --> TeamSlugLookupResultCore["Team Slug Lookup Result"]:::result
        TeamSlugLookupCore -.->|Failure: DB Error| TeamSlugLookupDBErrorCore["DB Error"]:::dberror
        TeamSlugLookupDBErrorCore -.-> TeamSlugLookupResultCore
        TeamSlugLookupResultCore --> TeamSlugLookupOutput([" "]):::result
    end
    
    %% Team Lookup Generic Operation
    subgraph TeamLookupOp["Team Lookup Operation"]
        direction TB
        TeamLookupInput([" "]):::input --> TeamLookupCore["DB: Find<br>Team"]:::dboperation
        TeamLookupCore --> TeamLookupResultCore["Team Lookup Result"]:::result
        TeamLookupCore -.->|Failure: DB Error| TeamLookupDBErrorCore["DB Error"]:::dberror
        TeamLookupDBErrorCore -.-> TeamLookupResultCore
        TeamLookupResultCore --> TeamLookupOutput([" "]):::result
    end
    
    %% User Creation Operation
    subgraph UserCreationOp["User Creation Operation"]
        direction TB
        UserCreationInput([" "]):::input --> UserCreationCore["DB: Create<br>User Account"]:::dboperation
        UserCreationCore --> UserCreationResultCore["User Creation Result"]:::result
        UserCreationCore -.->|Failure: DB Error| UserCreationDBErrorCore["DB Error"]:::dberror
        UserCreationDBErrorCore -.-> UserCreationResultCore
        UserCreationResultCore --> UserCreationOutput([" "]):::result
    end
    
    %% Team Creation Operation
    subgraph TeamCreationOp["Team Creation Operation"]
        direction TB
        TeamCreationInput([" "]):::input --> TeamCreationCore["DB: Create<br>Team"]:::dboperation
        TeamCreationCore --> TeamCreationResultCore["Team Creation Result"]:::result
        TeamCreationCore -.->|Failure: DB Error| TeamCreationDBErrorCore["DB Error"]:::dberror
        TeamCreationDBErrorCore -.-> TeamCreationResultCore
        TeamCreationResultCore --> TeamCreationOutput([" "]):::result
    end
    
    %% Invitation Creation Operation
    subgraph InvitationCreationOp["Invitation Creation Operation"]
        direction TB
        InvitationCreationInput([" "]):::input --> InvitationCreationCore["DB: Create<br>Invitation"]:::dboperation
        InvitationCreationCore --> InvitationCreationResultCore["Invitation Creation Result"]:::result
        InvitationCreationCore -.->|Failure: DB Error| InvitationCreationDBErrorCore["DB Error"]:::dberror
        InvitationCreationDBErrorCore -.-> InvitationCreationResultCore
        InvitationCreationResultCore --> InvitationCreationOutput([" "]):::result
    end
    
    %% Metrics Recording Operation
    subgraph MetricsRecordOp["Metrics Recording Operation"]
        direction TB
        MetricsRecordInput([" "]):::input --> MetricsRecordCore["Record<br>Signup Metrics"]:::process
        MetricsRecordCore --> MetricsRecordResultCore["Metrics Record Result"]:::result
        MetricsRecordCore -.->|Failure: Metric Error| MetricsErrorCore(["Failure:<br>Metrics Recording Error"]):::failure
        MetricsErrorCore -.-> MetricsRecordResultCore
        MetricsRecordResultCore --> MetricsRecordOutput([" "]):::result
    end
    
    %% Slack Notification Operation
    subgraph SlackNotifyOp["Slack Notification Operation"]
        direction TB
        SlackNotifyInput([" "]):::input --> SlackNotifyCore["Notify<br>Slack Channel"]:::process
        SlackNotifyCore --> SlackNotifyResultCore["Slack Notify Result"]:::result
        SlackNotifyCore -.->|Failure: Notify Error| NotificationErrorCore(["Failure:<br>Slack Notification Error"]):::failure
        NotificationErrorCore -.-> SlackNotifyResultCore
        SlackNotifyResultCore --> SlackNotifyOutput([" "]):::result
    end
    
    %% Invitation Lookup Operation
    subgraph InvitationLookupOp["Invitation Lookup Operation"]
        direction TB
        InvitationLookupInput([" "]):::input --> InvitationLookupCore["DB: Find<br>Invitation"]:::dboperation
        InvitationLookupCore --> InvitationLookupResultCore["Invitation Lookup Result"]:::result
        InvitationLookupCore -.->|Failure: DB Error| InvitationLookupDBErrorCore["DB Error"]:::dberror
        InvitationLookupDBErrorCore -.-> InvitationLookupResultCore
        InvitationLookupResultCore --> InvitationLookupOutput([" "]):::result
    end

    %% SELF REGISTRATION RAILWAY
    subgraph SelfRailway["Self Registration Railway"]
        direction LR

        %% Success Track with Result nodes
        SelfStart([" "]):::input --> SelfRecaptchaInput([" "]):::input
        SelfRecaptchaOutput([" "]):::result --> FormValidation["Validate<br>User Form"]:::process
        FormValidation --> FormValidationResult["Form Validation Result"]:::result
        FormValidation -.->|Failure: Invalid Data| ValidationCategories
        
        subgraph ValidationCategories["Validation Failure Types"]
            direction TB
            EmailValidationError["Email Error:<br>invalid-format<br>not-work-email"]:::failure
            NameValidationError["Name Error:<br>empty"]:::failure
            PasswordValidationError["Password Error:<br>empty<br>weak"]:::failure

            EmailValidationError & NameValidationError & PasswordValidationError --> ValidationFailure(["Failure:<br>Form Validation Error"]):::failure
        end
        ValidationFailure -.-> FormValidationResult
        
        FormValidationResult -->|Pass to next| SelfUserLookupInput([" "]):::input
        SelfUserLookupOutput([" "]):::result -->|Pass to next| UserExistsCheck{"User<br>Exists?"}:::conditional
        UserExistsCheck -.->|Option is Some| UserExistsError(["Failure:<br>User Already Exists"]):::failure
        UserExistsError -.-> UserExistsResult["User Exists Result"]:::result
        UserExistsCheck -->|Option is None| UserExistsResult
        
        UserExistsResult -->|Pass to next| SelfTeamSlugInput([" "]):::inputa
        SelfTeamSlugOutput([" "]):::result -->|Pass to next| TeamUniqueCheck{"Team<br>Exists?"}:::conditional
        TeamUniqueCheck -.->|Option is Some| TeamExistsError(["Failure:<br>Team Name Already Taken"]):::failure
        TeamExistsError -.-> TeamUniqueResult["Team Unique Result"]:::result
        TeamUniqueCheck -->|Option is None| TeamUniqueResult
        
        TeamUniqueResult -->|Pass to next| SelfUserCreationInput([" "]):::input
        SelfUserCreationOutput([" "]):::result -->|Pass to next| SelfTeamCreationInput([" "]):::input
        SelfTeamCreationOutput([" "]):::result -->|Pass to next| EmailVerification["Send Email<br>Verification"]:::process
        EmailVerification --> EmailVerificationResult["Email Verification Result"]:::result
        EmailVerification -.->|Failure: Email Error| EmailSendError(["Failure:<br>Email Verification Error"]):::failure
        EmailSendError -.-> EmailVerificationResult
        
        EmailVerificationResult -->|Pass to next| SelfMetricsInput([" "]):::input
        SelfMetricsOutput([" "]):::result -->|Pass to next| SelfSlackInput([" "]):::input
        SelfSlackOutput([" "]):::result -->|Pass to next| SuccessResponse["HTTP 201<br>Success Response"]:::endpoint
        
        %% Route all errors to error response
        FormValidationResult & UserExistsResult & TeamUniqueResult & EmailVerificationResult -.->|Failure| ErrorResponse["HTTP Error<br>Response"]:::endpoint
    end

    %% INVITATION RAILWAY
    subgraph InviteRailway["Invitation Registration Railway"]
        direction LR

        %% Success Track with Result nodes
        InviteStart([" "]):::input --> InviteRecaptchaInput([" "]):::input
        InviteRecaptchaOutput([" "]):::result -->|Success| InviteInvitationLookupInput([" "]):::input
        InviteInvitationLookupOutput([" "]):::result -->|Success| InvitationExistsCheck{"Invitation<br>Exists?"}:::conditional
        InvitationExistsCheck -.->|Option is None| InvitationNotFoundError(["Failure:<br>Invitation Not Found"]):::failure
        InvitationNotFoundError -.-> InvitationExistsResult["Invitation Exists Result"]:::result
        InvitationExistsCheck -->|Option is Some| InvitationExistsResult
        
        InvitationExistsResult -->|Pass to next| InvitationExpiryCheck{"Invitation<br>Expired?"}:::conditional
        InvitationExpiryCheck -.->|Expired| InvitationExpiredError(["Failure:<br>Invitation Expired"]):::failure
        InvitationExpiredError -.-> InvitationExpiryResult["Invitation Expiry Result"]:::result
        InvitationExpiryCheck -->|Not Expired| InvitationExpiryResult
        
        InvitationExpiryResult -->|Pass to next| InviteEmailValidation["Validate<br>Email Format"]:::process
        InviteEmailValidation --> InviteEmailValidationResult["Email Validation Result"]:::result
        InviteEmailValidation -.->|Failure: Invalid Format| InvalidEmailFormatError(["Failure:<br>Invalid Email Format"]):::failure
        InviteEmailValidation -.->|Failure: Not Work Email| NonWorkEmailError(["Failure:<br>Not Work Email"]):::failure
        InvalidEmailFormatError & NonWorkEmailError -.-> InviteEmailValidationResult
        
        InviteEmailValidationResult -->|Pass to next| InviteFormValidation["Validate<br>User Form"]:::process
        InviteFormValidation --> InviteFormValidationResult["Form Validation Result"]:::result
        InviteFormValidation -.->|Failure: Invalid Data| InviteValidationCategories
        
        subgraph InviteValidationCategories["Validation Failure Types"]
            direction TB
            InviteNameValidationError["Name Error:<br>empty"]:::failure
            InvitePasswordValidationError["Password Error:<br>empty<br>weak"]:::failure

            InviteNameValidationError & InvitePasswordValidationError --> InviteValidationFailure(["Failure:<br>Form Validation Error"]):::failure
        end
        InviteValidationFailure -.-> InviteFormValidationResult
        
        InviteFormValidationResult -->|Pass to next| InviteUserLookupInput([" "]):::input
        InviteUserLookupOutput([" "]):::result -->|Pass to next| InviteUserExistsCheck{"User<br>Exists?"}:::conditional
        InviteUserExistsCheck -.->|Option is Some| InviteUserExistsError(["Failure:<br>User Already Exists"]):::failure
        InviteUserExistsError -.-> InviteUserExistsResult["User Exists Result"]:::result
        InviteUserExistsCheck -->|Option is None| InviteUserExistsResult
        
        InviteUserExistsResult -->|Pass to next| InviteUserCreationInput([" "]):::input
        InviteUserCreationOutput([" "]):::result -->|Pass to next| InviteTeamLookupInput([" "]):::input
        InviteTeamLookupOutput([" "]):::result -->|Pass to next| InviteTeamExistsCheck{"Team<br>Exists?"}:::conditional
        InviteTeamExistsCheck -.->|Option is None| TeamNotFoundError(["Failure:<br>Team Not Found"]):::failure
        TeamNotFoundError -.-> InviteTeamExistsResult["Team Exists Result"]:::result
        InviteTeamExistsCheck -->|Option is Some| InviteTeamExistsResult
        
        InviteTeamExistsResult -->|Pass to next| InviteMetricsInput([" "]):::input
        InviteMetricsOutput([" "]):::result -->|Pass to next| InviteSlackInput([" "]):::input
        InviteSlackOutput([" "]):::result -->|Pass to next| InviteSuccessResponse["HTTP 201<br>Success Response"]:::endpoint
        
        %% Route all errors to error response
        InvitationExistsResult & InvitationExpiryResult & InviteEmailValidationResult & InviteFormValidationResult & InviteUserExistsResult & InviteTeamExistsResult -.->|Failure| InviteErrorResponse["HTTP Error<br>Response"]:::endpoint
    end

    %% INVITATION CREATION RAILWAY
    subgraph InviteCreationRailway["Invitation Creation Railway"]
        direction LR
        
        %% Starting point for invitation creation
        CreateInviteStart(["Create Invitation Request"]):::input --> InviteCreationFormValidation["Validate<br>Invitation Form"]:::process
        
        InviteCreationFormValidation --> InviteCreationFormResult["Form Validation Result"]:::result
        InviteCreationFormValidation -.->|Failure: Invalid Data| InviteCreationValidationCategories
        
        subgraph InviteCreationValidationCategories["Validation Failure Types"]
            direction TB
            InviteCreationEmailError["Email Error:<br>invalid-format<br>not-work-email"]:::failure
            InviteCreationTeamSlugError["Team Slug Error:<br>empty"]:::failure

            InviteCreationEmailError & InviteCreationTeamSlugError --> InviteCreationValidationFailure(["Failure:<br>Form Validation Error"]):::failure
        end
        InviteCreationValidationFailure -.-> InviteCreationFormResult
        
        InviteCreationFormResult -->|Pass to next| CreateInviteTeamSlugInput([" "]):::input
        CreateInviteTeamSlugOutput([" "]):::result -->|Pass to next| TeamExistsForInviteCheck{"Team<br>Exists?"}:::conditional
        TeamExistsForInviteCheck -.->|Option is None| TeamNotFoundForInviteError(["Failure:<br>Team Not Found"]):::failure
        TeamNotFoundForInviteError -.-> TeamExistsForInviteResult["Team Exists Result"]:::result
        TeamExistsForInviteCheck -->|Option is Some| TeamExistsForInviteResult
        
        TeamExistsForInviteResult -->|Pass to next| CreateInviteInvitationInput([" "]):::input
        CreateInviteInvitationOutput([" "]):::result -->|Pass to next| SendInvitationEmail["Send Invitation<br>Email"]:::process
        SendInvitationEmail --> SendInvitationEmailResult["Email Send Result"]:::result
        SendInvitationEmail -.->|Failure: Email Error| InvitationEmailSendError(["Failure:<br>Email Send Error"]):::failure
        InvitationEmailSendError -.-> SendInvitationEmailResult
        
        SendInvitationEmailResult -->|Pass to next| FormatInviteResponse["Format<br>Response"]:::process
        FormatInviteResponse --> InviteCreationSuccessResponse["HTTP 200<br>Success Response"]:::endpoint
        
        %% Route all errors to error response
        InviteCreationFormResult & TeamExistsForInviteResult & SendInvitationEmailResult -.->|Failure| InviteCreationErrorResponse["HTTP 200 with<br>Error Result"]:::endpoint
    end

    %% CONNECT MAIN FLOW TO SUBGRAPHS
    RegistrationType -->|Self| SelfStart
    RegistrationType -->|Invitation| InviteStart

    %% Connect Recaptcha validation subgraphs
    SelfRecaptchaInput --> RecaptchaInput
    RecaptchaOutput --> SelfRecaptchaOutput
    InviteRecaptchaInput --> RecaptchaInput
    RecaptchaOutput --> InviteRecaptchaOutput

    %% Connect User Lookup subgraphs
    SelfUserLookupInput --> UserLookupInput
    UserLookupOutput --> SelfUserLookupOutput
    InviteUserLookupInput --> UserLookupInput
    UserLookupOutput --> InviteUserLookupOutput

    %% Connect Team Lookup by Slug subgraphs
    SelfTeamSlugInput --> TeamSlugInput
    TeamSlugLookupOutput --> SelfTeamSlugOutput
    CreateInviteTeamSlugInput --> TeamSlugInput
    TeamSlugLookupOutput --> CreateInviteTeamSlugOutput

    %% Connect Team Lookup subgraphs
    InviteTeamLookupInput --> TeamLookupInput
    TeamLookupOutput --> InviteTeamLookupOutput

    %% Connect User Creation subgraphs
    SelfUserCreationInput --> UserCreationInput
    UserCreationOutput --> SelfUserCreationOutput
    InviteUserCreationInput --> UserCreationInput
    UserCreationOutput --> InviteUserCreationOutput

    %% Connect Team Creation subgraphs
    SelfTeamCreationInput --> TeamCreationInput
    TeamCreationOutput --> SelfTeamCreationOutput

    %% Connect Invitation Creation subgraphs
    CreateInviteInvitationInput --> InvitationCreationInput
    InvitationCreationOutput --> CreateInviteInvitationOutput

    %% Connect Invitation Lookup subgraphs
    InviteInvitationLookupInput --> InvitationLookupInput
    InvitationLookupOutput --> InviteInvitationLookupOutput

    %% Connect Metrics Record subgraphs
    SelfMetricsInput --> MetricsRecordInput
    MetricsRecordOutput --> SelfMetricsOutput
    InviteMetricsInput --> MetricsRecordInput
    MetricsRecordOutput --> InviteMetricsOutput

    %% Connect Slack Notification subgraphs
    SelfSlackInput --> SlackNotifyInput
    SlackNotifyOutput --> SelfSlackOutput
    InviteSlackInput --> SlackNotifyInput
    SlackNotifyOutput --> InviteSlackOutput
```