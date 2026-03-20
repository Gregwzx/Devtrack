// src/hooks/useParallaxScroll.ts
// Hook reutilizável: fornece scrollY animado + estilos derivados para
// header colapsável com paralaxe. Compatível com react-native-reanimated 4.
import {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolation,
    withTiming,
    withSpring,
} from 'react-native-reanimated';

export const HEADER_EXPANDED  = 90;   // altura máxima do header parallax
export const HEADER_COLLAPSED = 56;   // altura mínima (sticky)
export const PARALLAX_HEIGHT  = 120;  // altura da zona de paralaxe visual

export function useParallaxScroll() {
    const scrollY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    // Título principal: encolhe e sobe ao rolar
    const titleStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            scrollY.value,
            [0, PARALLAX_HEIGHT],
            [1, 0.78],
            Extrapolation.CLAMP,
        );
        const translateY = interpolate(
            scrollY.value,
            [0, PARALLAX_HEIGHT],
            [0, -14],
            Extrapolation.CLAMP,
        );
        const opacity = interpolate(
            scrollY.value,
            [0, PARALLAX_HEIGHT * 0.6],
            [1, 0],
            Extrapolation.CLAMP,
        );
        return { transform: [{ scale }, { translateY }], opacity };
    });

    // Subtítulo: desaparece mais rápido
    const subtitleStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [0, PARALLAX_HEIGHT * 0.4],
            [1, 0],
            Extrapolation.CLAMP,
        );
        const translateY = interpolate(
            scrollY.value,
            [0, PARALLAX_HEIGHT * 0.4],
            [0, -8],
            Extrapolation.CLAMP,
        );
        return { opacity, transform: [{ translateY }] };
    });

    // Mini-título colapsado que aparece quando rola
    const collapsedTitleStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [PARALLAX_HEIGHT * 0.5, PARALLAX_HEIGHT],
            [0, 1],
            Extrapolation.CLAMP,
        );
        const translateY = interpolate(
            scrollY.value,
            [PARALLAX_HEIGHT * 0.5, PARALLAX_HEIGHT],
            [8, 0],
            Extrapolation.CLAMP,
        );
        return { opacity, transform: [{ translateY }] };
    });

    // Container do header: altura colapsa
    const headerContainerStyle = useAnimatedStyle(() => {
        const height = interpolate(
            scrollY.value,
            [0, PARALLAX_HEIGHT],
            [HEADER_EXPANDED, HEADER_COLLAPSED],
            Extrapolation.CLAMP,
        );
        const borderBottomOpacity = interpolate(
            scrollY.value,
            [PARALLAX_HEIGHT * 0.8, PARALLAX_HEIGHT],
            [0, 1],
            Extrapolation.CLAMP,
        );
        return {
            height,
            borderBottomColor: `rgba(42, 32, 64, ${borderBottomOpacity})`,
            borderBottomWidth: 1,
        };
    });

    // Barra de fundo do header: fica sólida ao colapsar
    const headerBgStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [PARALLAX_HEIGHT * 0.5, PARALLAX_HEIGHT],
            [0, 1],
            Extrapolation.CLAMP,
        );
        return { opacity };
    });

    // Conteúdo da lista: tem padding-top para não ficar atrás do header expandido
    const contentPaddingStyle = useAnimatedStyle(() => {
        // estático — só para referência no layout
        return { paddingTop: 0 };
    });

    return {
        scrollY,
        scrollHandler,
        titleStyle,
        subtitleStyle,
        collapsedTitleStyle,
        headerContainerStyle,
        headerBgStyle,
    };
}

// ─── Utilitário: animação de troca de filtro ──────────────────────────────────
// Usado quando o usuário muda de categoria/filtro — flash suave no conteúdo
export function useFilterTransition() {
    const opacity = useSharedValue(1);

    const triggerTransition = (onMidpoint: () => void) => {
        opacity.value = withTiming(0, { duration: 120 }, () => {
            // executa no JS thread via callback — troca o estado
            'worklet';
        });
        // Workaround: executa o callback após 120ms no JS thread
        setTimeout(() => {
            onMidpoint();
            opacity.value = withSpring(1, { damping: 18, stiffness: 200 });
        }, 120);
    };

    const contentStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return { triggerTransition, contentStyle };
}