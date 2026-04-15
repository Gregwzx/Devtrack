// LearningController.java
@RestController
@RequestMapping("/api/v1/learnings")
@RequiredArgsConstructor
public class LearningController {

    private final RegisterLearning registerLearning;
    private final GetUserLearnings getUserLearnings;

    @PostMapping
    public ResponseEntity<LearningDTO> create(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestBody @Valid CreateLearningDTO dto
    ) {
        String userId = ((CustomUserDetails) userDetails).getId();
        LearningDTO result = registerLearning.execute(userId, dto);
        return ResponseEntity.status(201).body(result);
    }

    @GetMapping
    public ResponseEntity<Page<LearningDTO>> list(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        String userId = ((CustomUserDetails) userDetails).getId();
        return ResponseEntity.ok(getUserLearnings.execute(userId, page, size));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
        @AuthenticationPrincipal UserDetails userDetails,
        @PathVariable String id
    ) {
        // implementação com validação de owner
        return ResponseEntity.noContent().build();
    }
}

// AuthController.java
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(
        @RequestBody @Valid RegisterDTO dto
    ) {
        return ResponseEntity.status(201).body(authService.register(dto));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(
        @RequestBody @Valid LoginDTO dto
    ) {
        return ResponseEntity.ok(authService.login(dto));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponseDTO> refresh(
        @RequestHeader("X-Refresh-Token") String refreshToken
    ) {
        return ResponseEntity.ok(authService.refresh(refreshToken));
    }
}