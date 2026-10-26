pub(crate) mod delete;
pub(crate) mod toggle;

use hearth::router::module_param;

module_param!(pub(crate) todo_id: u64, error = bad_request);
