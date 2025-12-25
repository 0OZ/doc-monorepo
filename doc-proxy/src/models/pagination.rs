use serde::{Deserialize, Serialize};

/// Pagination result structure similar to Spring Data's Page interface.
/// Contains both the data and comprehensive pagination metadata.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageResult<T> {
    /// The actual page content/data
    pub content: Vec<T>,

    /// Current page number (0-indexed)
    pub number: u64,

    /// Number of elements per page (page size)
    pub size: u64,

    /// Total number of elements across all pages
    pub total_elements: u64,

    /// Total number of pages
    pub total_pages: u64,

    /// Number of elements in the current page
    pub number_of_elements: usize,

    /// Whether this is the first page
    pub first: bool,

    /// Whether this is the last page
    pub last: bool,

    /// Whether the page has content
    pub empty: bool,

    /// Sorting information (optional)
    pub sort: Option<SortInfo>,
}

/// Sort information for the paginated query
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SortInfo {
    pub sorted: bool,
    pub unsorted: bool,
    pub empty: bool,
}

impl<T> PageResult<T> {
    /// Creates a new PageResult with the given data and pagination info.
    ///
    /// # Arguments
    /// * `content` - The page data
    /// * `page` - Current page number (0-indexed)
    /// * `size` - Page size
    /// * `total_elements` - Total number of elements across all pages
    pub fn new(content: Vec<T>, page: u64, size: u64, total_elements: u64) -> Self {
        let number_of_elements = content.len();
        let total_pages = if size > 0 {
            (total_elements + size - 1) / size
        } else {
            0
        };

        let first = page == 0;
        let last = page >= total_pages.saturating_sub(1) && total_pages > 0;
        let empty = content.is_empty();

        Self {
            content,
            number: page,
            size,
            total_elements,
            total_pages,
            number_of_elements,
            first,
            last,
            empty,
            sort: None,
        }
    }

    /// Creates a new PageResult with sorting information
    pub fn with_sort(mut self, sort_info: SortInfo) -> Self {
        self.sort = Some(sort_info);
        self
    }

    /// Creates an empty PageResult
    pub fn empty(page: u64, size: u64) -> Self {
        Self::new(Vec::new(), page, size, 0)
    }

    /// Check if there is a next page
    pub fn has_next(&self) -> bool {
        !self.last && self.total_pages > 0
    }

    /// Check if there is a previous page
    pub fn has_previous(&self) -> bool {
        !self.first && self.number > 0
    }

    /// Get the next page number if it exists
    pub fn next_page(&self) -> Option<u64> {
        if self.has_next() {
            Some(self.number + 1)
        } else {
            None
        }
    }

    /// Get the previous page number if it exists
    pub fn previous_page(&self) -> Option<u64> {
        if self.has_previous() {
            Some(self.number - 1)
        } else {
            None
        }
    }

    /// Map the content to a different type while preserving pagination metadata
    pub fn map<U, F>(self, f: F) -> PageResult<U>
    where
        F: FnMut(T) -> U,
    {
        PageResult {
            content: self.content.into_iter().map(f).collect(),
            number: self.number,
            size: self.size,
            total_elements: self.total_elements,
            total_pages: self.total_pages,
            number_of_elements: self.number_of_elements,
            first: self.first,
            last: self.last,
            empty: self.empty,
            sort: self.sort,
        }
    }
}

impl SortInfo {
    /// Creates a new sorted SortInfo
    pub fn sorted() -> Self {
        Self {
            sorted: true,
            unsorted: false,
            empty: false,
        }
    }

    /// Creates a new unsorted SortInfo
    pub fn unsorted() -> Self {
        Self {
            sorted: false,
            unsorted: true,
            empty: true,
        }
    }
}

/// Pageable request parameters (similar to Spring's Pageable)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pageable {
    /// Page number (0-indexed)
    pub page: u64,

    /// Page size (number of elements per page)
    pub size: u64,
}

impl Pageable {
    /// Creates a new Pageable with the given page and size
    pub fn new(page: u64, size: u64) -> Self {
        Self { page, size }
    }

    /// Creates a Pageable from 1-indexed page number (converts to 0-indexed)
    pub fn from_one_indexed(page: u64, size: u64) -> Self {
        Self {
            page: page.saturating_sub(1),
            size,
        }
    }

    /// Gets the offset for database queries
    pub fn offset(&self) -> u64 {
        self.page * self.size
    }

    /// Gets the limit for database queries
    pub fn limit(&self) -> u64 {
        self.size
    }
}

impl Default for Pageable {
    fn default() -> Self {
        Self::new(0, 20)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_page_result_creation() {
        let data = vec![1, 2, 3, 4, 5];
        let page = PageResult::new(data.clone(), 0, 5, 15);

        assert_eq!(page.content, data);
        assert_eq!(page.number, 0);
        assert_eq!(page.size, 5);
        assert_eq!(page.total_elements, 15);
        assert_eq!(page.total_pages, 3);
        assert_eq!(page.number_of_elements, 5);
        assert!(page.first);
        assert!(!page.last);
        assert!(!page.empty);
    }

    #[test]
    fn test_page_result_last_page() {
        let data = vec![1, 2, 3];
        let page = PageResult::new(data, 2, 5, 13);

        assert!(page.last);
        assert!(!page.first);
    }

    #[test]
    fn test_page_result_empty() {
        let page: PageResult<i32> = PageResult::empty(0, 10);

        assert!(page.empty);
        assert_eq!(page.number_of_elements, 0);
        assert_eq!(page.total_elements, 0);
    }

    #[test]
    fn test_has_next_and_previous() {
        let page = PageResult::new(vec![1, 2, 3], 1, 3, 10);

        assert!(page.has_next());
        assert!(page.has_previous());
        assert_eq!(page.next_page(), Some(2));
        assert_eq!(page.previous_page(), Some(0));
    }

    #[test]
    fn test_map() {
        let page = PageResult::new(vec![1, 2, 3], 0, 3, 3);
        let mapped = page.map(|x| x * 2);

        assert_eq!(mapped.content, vec![2, 4, 6]);
        assert_eq!(mapped.number, 0);
        assert_eq!(mapped.total_elements, 3);
    }

    #[test]
    fn test_pageable() {
        let pageable = Pageable::new(2, 10);

        assert_eq!(pageable.offset(), 20);
        assert_eq!(pageable.limit(), 10);
    }

    #[test]
    fn test_pageable_from_one_indexed() {
        let pageable = Pageable::from_one_indexed(1, 10);

        assert_eq!(pageable.page, 0);
        assert_eq!(pageable.offset(), 0);
    }
}
