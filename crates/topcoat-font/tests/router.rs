use topcoat::{
    context::Cx,
    font::{Font, FontResolver, RouterBuilderFontExt, font},
    router::{
        Body, Method, Router, RouterBuilder, RouterBuilderDiscoverExt, StatusCode, header,
        request::Request, to_bytes,
    },
};

const DM_SANS: Font = font! {
    "DM Sans",
    @font-face {
        src: url("/dm-sans.woff2");
        font-weight: 1 1000;
        font-display: swap;
    }
};

const INSTRUMENT_SERIF: Font = font! {
    "Instrument Serif",
    @font-face {
        src: url("/instrument-serif.woff2");
        font-weight: 400;
    }
};

async fn assert_fonts_served(builder: RouterBuilder) {
    assert_stylesheets_served(builder, &[DM_SANS, INSTRUMENT_SERIF]).await;
}

async fn assert_stylesheets_served(builder: RouterBuilder, fonts: &[Font]) {
    let resolver = builder.get_app_context::<FontResolver>().unwrap();
    let paths: Vec<_> = fonts
        .iter()
        .copied()
        .map(|font| {
            let mut path = String::new();
            resolver.resolve(font, &mut path).unwrap();
            (font, path)
        })
        .collect();
    let router = builder.build();
    for (font, path) in paths {
        let response = router
            .handle(Request::builder().uri(&path).body(Body::empty()).unwrap())
            .await;
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            response.headers()[header::CONTENT_TYPE],
            "text/css; charset=utf-8"
        );
        let mut expected = String::new();
        font.faces().fmt(&Cx::default(), &mut expected).unwrap();
        assert_eq!(
            to_bytes(response.into_body(), usize::MAX).await.unwrap(),
            expected
        );

        let response = router
            .handle(
                Request::builder()
                    .method(Method::HEAD)
                    .uri(path)
                    .body(Body::empty())
                    .unwrap(),
            )
            .await;
        assert_eq!(response.status(), StatusCode::OK);
    }
}

#[tokio::test]
async fn discover_then_font() {
    assert_fonts_served(
        Router::builder()
            .discover()
            .font(DM_SANS)
            .font(INSTRUMENT_SERIF),
    )
    .await;
}

#[tokio::test]
async fn font_then_discover() {
    assert_fonts_served(
        Router::builder()
            .font(DM_SANS)
            .font(INSTRUMENT_SERIF)
            .discover(),
    )
    .await;
}

#[tokio::test]
async fn repeated_font_registration() {
    assert_fonts_served(
        Router::builder()
            .font(DM_SANS)
            .font(DM_SANS)
            .font(INSTRUMENT_SERIF),
    )
    .await;
}

#[tokio::test]
async fn repeated_font_discovery() {
    assert_fonts_served(Router::builder().discover_fonts().discover_fonts()).await;
}

#[tokio::test]
async fn identical_declarations_share_a_stylesheet_route() {
    const SAME_DM_SANS: Font = font! {
        "DM Sans",
        @font-face {
            src: url("/dm-sans.woff2");
            font-weight: 1 1000;
            font-display: swap;
        }
    };
    assert_fonts_served(
        Router::builder()
            .font(DM_SANS)
            .font(SAME_DM_SANS)
            .font(INSTRUMENT_SERIF),
    )
    .await;
}

#[tokio::test]
async fn different_faces_in_the_same_family_keep_separate_routes() {
    const BOLD: Font = font! {
        "DM Sans",
        @font-face {
            src: url("/dm-sans-bold.woff2");
            font-weight: 700;
        }
    };
    let builder = Router::builder().font(DM_SANS).font(BOLD).discover();
    let resolver = builder.get_app_context::<FontResolver>().unwrap();
    let mut normal_path = String::new();
    let mut bold_path = String::new();
    resolver.resolve(DM_SANS, &mut normal_path).unwrap();
    resolver.resolve(BOLD, &mut bold_path).unwrap();
    assert_ne!(normal_path, bold_path);
    assert_stylesheets_served(builder, &[DM_SANS, BOLD]).await;
}
