import { useEffect, useState } from "react";
import { api, API_URL } from "./api";
import "./App.css";

const OBJECTS = [
  "Account",
  "Opportunity",
  "Lead",
  "Contact",
  "Case",
];

const FIELDS = {
  Account: ["Name", "Phone", "Website", "Industry", "Type"],

  Opportunity: [
    "Name",
    "StageName",
    "CloseDate",
    "Amount",
    "Type",
  ],

  Lead: [
    "FirstName",
    "LastName",
    "Company",
    "Email",
    "Phone",
  ],

  Contact: [
    "FirstName",
    "LastName",
    "Email",
    "Phone",
    "Title",
  ],

  Case: [
    "CaseNumber",
    "Subject",
    "Status",
    "Priority",
    "Origin",
  ],
};

function App() {
  const [objectName, setObjectName] = useState("Account");

  const [records, setRecords] = useState([]);

  const [offset, setOffset] = useState(0);

  const [loading, setLoading] = useState(false);

  const [hasMore, setHasMore] = useState(true);

  const [error, setError] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form data
  const [formData, setFormData] = useState({});

  // ----------------------------------------
  // LOAD RECORDS
  // ----------------------------------------

  const loadRecords = async (reset = false) => {
    if (loading) return;

    setLoading(true);
    setError("");

    const currentOffset = reset ? 0 : offset;

    try {
      const response = await api.get(
        `/api/records/${objectName}`,
        {
          params: {
            offset: currentOffset,
          },
        }
      );

      const newRecords = response.data.records || [];

      if (reset) {
        setRecords(newRecords);
      } else {
        setRecords((prev) => [
          ...prev,
          ...newRecords,
        ]);
      }

      setOffset(currentOffset + newRecords.length);

      setHasMore(newRecords.length === 20);
    } catch (err) {
      console.error("Error loading records:", err);

      setError(
        err.response?.data?.error ||
          "Unable to load records."
      );
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------
  // LOAD WHEN OBJECT CHANGES
  // ----------------------------------------

  useEffect(() => {
    setRecords([]);
    setOffset(0);
    setHasMore(true);
    setError("");

    loadRecords(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectName]);

  // ----------------------------------------
  // LOGIN
  // ----------------------------------------

  const login = () => {
    window.location.href = `${API_URL}/auth/login`;
  };

  // ----------------------------------------
  // CREATE
  // ----------------------------------------

  const openCreateModal = () => {
    const initialData = {};

    FIELDS[objectName].forEach((field) => {
      initialData[field] = "";
    });

    setFormData(initialData);
    setShowCreateModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      await api.post(
        `/api/records/${objectName}`,
        formData
      );

      setShowCreateModal(false);
      setFormData({});

      // Reload records
      setRecords([]);
      setOffset(0);
      setHasMore(true);

      await loadRecords(true);
    } catch (err) {
      console.error("Create error:", err);

      setError(
        err.response?.data?.error ||
          "Unable to create record."
      );
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------
  // VIEW
  // ----------------------------------------

  const handleView = (record) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  // ----------------------------------------
  // EDIT
  // ----------------------------------------

  const handleEdit = (record) => {
    setSelectedRecord(record);

    const editData = {};

    FIELDS[objectName].forEach((field) => {
      editData[field] = record[field] ?? "";
    });

    setFormData(editData);
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!selectedRecord?.Id) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.put(
        `/api/records/${objectName}/${selectedRecord.Id}`,
        formData
      );

      setShowEditModal(false);
      setSelectedRecord(null);
      setFormData({});

      setRecords([]);
      setOffset(0);
      setHasMore(true);

      await loadRecords(true);
    } catch (err) {
      console.error("Update error:", err);

      setError(
        err.response?.data?.error ||
          "Unable to update record."
      );
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------
  // DELETE
  // ----------------------------------------

  const handleDelete = async (record) => {
    if (!record?.Id) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete this ${objectName}?`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.delete(
        `/api/records/${objectName}/${record.Id}`
      );

      setRecords((prev) =>
        prev.filter(
          (item) => item.Id !== record.Id
        )
      );
    } catch (err) {
      console.error("Delete error:", err);

      setError(
        err.response?.data?.error ||
          "Unable to delete record."
      );
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------
  // FORM CHANGE
  // ----------------------------------------

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ----------------------------------------
  // RENDER
  // ----------------------------------------

  return (
    <div className="app">

      {/* ================================
          NAVBAR
      ================================= */}

      <nav className="navbar">

        <div className="navbar-brand">
          <h1>Salesforce CRM</h1>

          <p>
            Manage your Salesforce records
          </p>
        </div>

        <button
          className="login-btn"
          onClick={login}
        >
          Login with Salesforce
        </button>

      </nav>

      {/* ================================
          MAIN CONTENT
      ================================= */}

      <main className="main-content">

        {/* PAGE HEADER */}

        <div className="page-header">

          <div>
            <h2>
              {objectName} Records
            </h2>

            <p>
              View and manage your Salesforce{" "}
              {objectName} records
            </p>
          </div>

          <button
            className="create-btn"
            onClick={openCreateModal}
          >
            + Create {objectName}
          </button>

        </div>

        {/* ================================
            TOOLBAR
        ================================= */}

        <div className="toolbar">

          <div className="select-group">

            <label>
              Salesforce Object
            </label>

            <select
              value={objectName}
              onChange={(e) =>
                setObjectName(e.target.value)
              }
            >

              {OBJECTS.map((object) => (
                <option
                  key={object}
                  value={object}
                >
                  {object}
                </option>
              ))}

            </select>

          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* ================================
            TABLE
        ================================= */}

        <div className="table-card">

          <div className="table-header">

            <div>
              <h3>
                {objectName} List
              </h3>

              <span>
                {records.length} records loaded
              </span>
            </div>

            <button
              className="refresh-btn"
              onClick={() => {
                setRecords([]);
                setOffset(0);
                setHasMore(true);
                loadRecords(true);
              }}
            >
              Refresh
            </button>

          </div>

          <div className="table-wrapper">

            <table>

              <thead>

                <tr>

                  {FIELDS[objectName].map(
                    (field) => (
                      <th key={field}>
                        {formatFieldName(field)}
                      </th>
                    )
                  )}

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {records.length === 0 &&
                !loading ? (

                  <tr>

                    <td
                      colSpan={
                        FIELDS[objectName]
                          .length + 1
                      }
                      className="empty-state"
                    >

                      <div>
                        <strong>
                          No records found
                        </strong>

                        <p>
                          Login to Salesforce or
                          create a new record.
                        </p>
                      </div>

                    </td>

                  </tr>

                ) : (

                  records.map((record) => (

                    <tr key={record.Id}>

                      {FIELDS[
                        objectName
                      ].map((field) => (

                        <td key={field}>

                          {record[field] !==
                            undefined &&
                          record[field] !==
                            null &&
                          record[field] !== ""
                            ? String(
                                record[field]
                              )
                            : "-"}

                        </td>

                      ))}

                      <td>

                        <div className="action-buttons">

                          <button
                            className="view-btn"
                            onClick={() =>
                              handleView(record)
                            }
                          >
                            View
                          </button>

                          <button
                            className="edit-btn"
                            onClick={() =>
                              handleEdit(record)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="delete-btn"
                            onClick={() =>
                              handleDelete(record)
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

          {/* LOADING */}

          {loading && (
            <div className="loading">
              Loading records...
            </div>
          )}

          {/* LOAD MORE */}

          {!loading &&
            hasMore &&
            records.length > 0 && (

              <div className="load-more">

                <button
                  onClick={() =>
                    loadRecords(false)
                  }
                >
                  Load More
                </button>

              </div>

            )}

        </div>

      </main>

      {/* =====================================================
          CREATE MODAL
      ====================================================== */}

      {showCreateModal && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowCreateModal(false)
          }
        >

          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h2>
                  Create {objectName}
                </h2>

                <p>
                  Enter the details below
                </p>
              </div>

              <button
                className="close-btn"
                onClick={() =>
                  setShowCreateModal(false)
                }
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleCreate}
            >

              <div className="form-grid">

                {FIELDS[objectName].map(
                  (field) => (

                    <div
                      className="form-group"
                      key={field}
                    >

                      <label>
                        {formatFieldName(field)}
                      </label>

                      <input
                        type={
                          getInputType(field)
                        }
                        value={
                          formData[field] || ""
                        }
                        onChange={(e) =>
                          handleInputChange(
                            field,
                            e.target.value
                          )
                        }
                        placeholder={`Enter ${formatFieldName(
                          field
                        )}`}
                      />

                    </div>

                  )
                )}

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() =>
                    setShowCreateModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-btn"
                  disabled={loading}
                >
                  {loading
                    ? "Creating..."
                    : `Create ${objectName}`}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =====================================================
          VIEW MODAL
      ====================================================== */}

      {showViewModal &&
        selectedRecord && (

          <div
            className="modal-overlay"
            onClick={() =>
              setShowViewModal(false)
            }
          >

            <div
              className="modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="modal-header">

                <div>
                  <h2>
                    {objectName} Details
                  </h2>

                  <p>
                    Record information
                  </p>
                </div>

                <button
                  className="close-btn"
                  onClick={() =>
                    setShowViewModal(false)
                  }
                >
                  ×
                </button>

              </div>

              <div className="details-list">

                {FIELDS[objectName].map(
                  (field) => (

                    <div
                      className="detail-row"
                      key={field}
                    >

                      <span>
                        {formatFieldName(
                          field
                        )}
                      </span>

                      <strong>
                        {selectedRecord[
                          field
                        ] || "-"}
                      </strong>

                    </div>

                  )
                )}

              </div>

              <div className="modal-actions">

                <button
                  className="cancel-btn"
                  onClick={() =>
                    setShowViewModal(false)
                  }
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        )}

      {/* =====================================================
          EDIT MODAL
      ====================================================== */}

      {showEditModal &&
        selectedRecord && (

          <div
            className="modal-overlay"
            onClick={() =>
              setShowEditModal(false)
            }
          >

            <div
              className="modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="modal-header">

                <div>
                  <h2>
                    Edit {objectName}
                  </h2>

                  <p>
                    Update record information
                  </p>
                </div>

                <button
                  className="close-btn"
                  onClick={() =>
                    setShowEditModal(false)
                  }
                >
                  ×
                </button>

              </div>

              <form
                onSubmit={handleUpdate}
              >

                <div className="form-grid">

                  {FIELDS[objectName].map(
                    (field) => (

                      <div
                        className="form-group"
                        key={field}
                      >

                        <label>
                          {formatFieldName(
                            field
                          )}
                        </label>

                        <input
                          type={getInputType(
                            field
                          )}
                          value={
                            formData[field] ||
                            ""
                          }
                          onChange={(e) =>
                            handleInputChange(
                              field,
                              e.target.value
                            )
                          }
                        />

                      </div>

                    )
                  )}

                </div>

                <div className="modal-actions">

                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() =>
                      setShowEditModal(false)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="save-btn"
                    disabled={loading}
                  >
                    {loading
                      ? "Saving..."
                      : "Save Changes"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

    </div>
  );
}

/* ============================================================
   HELPER FUNCTIONS
============================================================ */

function formatFieldName(field) {
  const formatted = field
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ");

  return formatted;
}

function getInputType(field) {
  const lower = field.toLowerCase();

  if (lower.includes("email")) {
    return "email";
  }

  if (lower.includes("date")) {
    return "date";
  }

  if (
    lower.includes("amount") ||
    lower.includes("phone")
  ) {
    return "text";
  }

  if (lower.includes("website")) {
    return "url";
  }

  return "text";
}

export default App;