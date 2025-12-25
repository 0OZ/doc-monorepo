//! Mock data for development mode.

use crate::handlers::leistungsnachweis::response::{
    ClientInfo, DeploymentResponse, DocumentStatus, LeistungsnachweisDetail,
    LeistungsnachweisListItem, ProviderInfo, ServiceDayResponse, ServiceResponse,
    SignedDocumentResponse,
};
use crate::models::pagination::PageResult;

/// Generate mock list of Leistungsnachweise for a client.
pub fn mock_list(client_id: &str, page: u64, size: u64) -> PageResult<LeistungsnachweisListItem> {
    let all_items = vec![
        LeistungsnachweisListItem {
            id: "lnw-2024-001".to_string(),
            client_id: client_id.to_string(),
            client_name: "Müller, Hans".to_string(),
            billing_month: "202412".to_string(),
            provider_ik: "123456789".to_string(),
            total_services: 12,
            has_signature: false,
            status: DocumentStatus::PendingSignature,
        },
        LeistungsnachweisListItem {
            id: "lnw-2024-002".to_string(),
            client_id: client_id.to_string(),
            client_name: "Müller, Hans".to_string(),
            billing_month: "202411".to_string(),
            provider_ik: "123456789".to_string(),
            total_services: 15,
            has_signature: false,
            status: DocumentStatus::PendingSignature,
        },
        LeistungsnachweisListItem {
            id: "lnw-2024-003".to_string(),
            client_id: client_id.to_string(),
            client_name: "Müller, Hans".to_string(),
            billing_month: "202410".to_string(),
            provider_ik: "123456789".to_string(),
            total_services: 10,
            has_signature: true,
            status: DocumentStatus::Signed,
        },
    ];

    let total = all_items.len() as u64;
    let start = (page * size) as usize;
    let items: Vec<_> = all_items
        .into_iter()
        .skip(start)
        .take(size as usize)
        .collect();

    PageResult::new(items, page, size, total)
}

/// Generate mock detail for a single Leistungsnachweis.
pub fn mock_detail(id: &str) -> Option<LeistungsnachweisDetail> {
    let (billing_month, status) = match id {
        "lnw-2024-001" => ("202412", DocumentStatus::PendingSignature),
        "lnw-2024-002" => ("202411", DocumentStatus::PendingSignature),
        "lnw-2024-003" => ("202410", DocumentStatus::Signed),
        _ => return None,
    };

    Some(LeistungsnachweisDetail {
        id: id.to_string(),
        client: ClientInfo {
            versichertennummer: "A123456789".to_string(),
            name: "Müller".to_string(),
            vorname: "Hans".to_string(),
        },
        provider: ProviderInfo {
            ik: "123456789".to_string(),
            responsible_staff_id: "LBNR-001".to_string(),
        },
        billing_month: billing_month.to_string(),
        service_days: mock_service_days(billing_month),
        signature: None,
        status,
    })
}

fn mock_service_days(billing_month: &str) -> Vec<ServiceDayResponse> {
    let year = &billing_month[0..4];
    let month = &billing_month[4..6];

    vec![
        ServiceDayResponse {
            date: format!("{}{}01", year, month),
            display_date: format!("{}-{}-01", year, month),
            deployments: vec![
                DeploymentResponse {
                    sequence_number: 1,
                    start_time: "0800".to_string(),
                    display_start_time: "08:00".to_string(),
                    services: vec![
                        ServiceResponse {
                            code: "01".to_string(),
                            description: "Grundpflege".to_string(),
                            quantity: Some("1".to_string()),
                            duration_minutes: Some(30),
                            staff_ids: vec!["LBNR-001".to_string()],
                        },
                        ServiceResponse {
                            code: "02".to_string(),
                            description: "Behandlungspflege".to_string(),
                            quantity: Some("1".to_string()),
                            duration_minutes: Some(15),
                            staff_ids: vec!["LBNR-001".to_string()],
                        },
                    ],
                },
                DeploymentResponse {
                    sequence_number: 2,
                    start_time: "1800".to_string(),
                    display_start_time: "18:00".to_string(),
                    services: vec![ServiceResponse {
                        code: "01".to_string(),
                        description: "Grundpflege".to_string(),
                        quantity: Some("1".to_string()),
                        duration_minutes: Some(30),
                        staff_ids: vec!["LBNR-002".to_string()],
                    }],
                },
            ],
        },
        ServiceDayResponse {
            date: format!("{}{}02", year, month),
            display_date: format!("{}-{}-02", year, month),
            deployments: vec![DeploymentResponse {
                sequence_number: 1,
                start_time: "0900".to_string(),
                display_start_time: "09:00".to_string(),
                services: vec![
                    ServiceResponse {
                        code: "03".to_string(),
                        description: "Hauswirtschaftliche Versorgung".to_string(),
                        quantity: Some("1".to_string()),
                        duration_minutes: Some(60),
                        staff_ids: vec!["LBNR-003".to_string()],
                    },
                ],
            }],
        },
        ServiceDayResponse {
            date: format!("{}{}03", year, month),
            display_date: format!("{}-{}-03", year, month),
            deployments: vec![
                DeploymentResponse {
                    sequence_number: 1,
                    start_time: "0730".to_string(),
                    display_start_time: "07:30".to_string(),
                    services: vec![
                        ServiceResponse {
                            code: "01".to_string(),
                            description: "Grundpflege".to_string(),
                            quantity: Some("1".to_string()),
                            duration_minutes: Some(45),
                            staff_ids: vec!["LBNR-001".to_string()],
                        },
                    ],
                },
            ],
        },
    ]
}

/// Generate mock response for signing.
pub fn mock_sign_response(id: &str) -> SignedDocumentResponse {
    SignedDocumentResponse {
        id: id.to_string(),
        status: DocumentStatus::Signed,
        signed_at: Some(chrono::Local::now().format("%Y-%m-%dT%H:%M:%S").to_string()),
        document_url: Some(format!("/api/documents/{}/download", id)),
        message: Some("Dokument erfolgreich signiert".to_string()),
    }
}
