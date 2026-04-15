// User.java
@Entity
@Table(name = "users")
@Data
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    private String photoUrl;
    private String bio;
    private String bannerColor;
    private String studyArea;      // frontend | backend | fullstack

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Learning> learnings = new ArrayList<>();

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private Streak streak;
}

// Learning.java
@Entity
@Table(name = "learnings")
@Data
@Builder
public class Learning {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String text;

    private String area;
    private String type;           // concept | bug | project | reading | tip
    private String stacksJson;     // ["React", "TypeScript"] serializado

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @CreationTimestamp
    private LocalDateTime createdAt;
}

// Streak.java
@Entity
@Table(name = "streaks")
@Data
@Builder
public class Streak {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private int count;
    private LocalDate lastDate;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}