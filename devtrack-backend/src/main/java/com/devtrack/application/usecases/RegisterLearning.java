// RegisterLearning.java
@Service
@RequiredArgsConstructor
public class RegisterLearning {

    private final LearningRepository learningRepository;
    private final UserRepository userRepository;
    private final UpdateStreak updateStreak;

    public LearningDTO execute(String userId, CreateLearningDTO dto) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException(userId));

        Learning learning = Learning.builder()
            .text(dto.getText())
            .area(dto.getArea())
            .type(dto.getType())
            .stacksJson(serializeStacks(dto.getStacks()))
            .user(user)
            .build();

        Learning saved = learningRepository.save(learning);

        // atualiza streak automaticamente
        updateStreak.execute(user);

        return LearningDTO.from(saved);
    }

    private String serializeStacks(List<String> stacks) {
        // simples JSON string — evita tabela extra
        return stacks != null ? String.join(",", stacks) : "";
    }
}

// UpdateStreak.java
@Service
@RequiredArgsConstructor
public class UpdateStreak {

    private final StreakRepository streakRepository;

    public void execute(User user) {
        Streak streak = streakRepository.findByUser(user)
            .orElse(Streak.builder().user(user).count(0).build());

        LocalDate today = LocalDate.now();

        if (streak.getLastDate() == null) {
            streak.setCount(1);
        } else if (streak.getLastDate().equals(today)) {
            return; // já registrou hoje
        } else if (streak.getLastDate().equals(today.minusDays(1))) {
            streak.setCount(streak.getCount() + 1);
        } else {
            streak.setCount(1); // streak quebrado
        }

        streak.setLastDate(today);
        streakRepository.save(streak);
    }
}