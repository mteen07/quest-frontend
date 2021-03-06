import * as Yup from 'yup'
import { Formik, Form } from 'formik'
import TextInput from '../../../../components/forms/TextInput'
import SelectInput from '../../../../components/forms/SelectInput'
import { toast } from 'react-toastify'
import ClueApi from '../../../../api/clue'
import { useEffect, useRef, useState } from 'react'
import GameApi from '../../../../api/game'
import { EditorState, convertToRaw, ContentState, convertFromHTML } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import { Editor } from "react-draft-wysiwyg";
import { useParams } from 'react-router-dom';

function AddClue({ gameName, selectedClue, setClues }) {
	const [file, setFile] = useState(null)
	const [fileError, setFileError] = useState("")
	const [submited, setSubmited] = useState(false)
	const [games, setGames] = useState([]);
	const { id } = useParams()
	const [editorState, setEditorState] = useState(EditorState.createEmpty())
	const [clueText, setClueText] = useState("");
	const [clueTextError, setClueTextError] = useState(false);
	const closeBtnRef = useRef();

	useEffect(() => {
		if (selectedClue && Object.keys(selectedClue).length > 0) {
			setEditorState(EditorState.createWithContent(
				ContentState.createFromBlockArray(
					convertFromHTML(selectedClue?.text)
				)
			))
			setClueText(selectedClue?.text);
		}
	}, [selectedClue]);

	const onEditorStateChange = (editorState) => {
		setClueText(draftToHtml(convertToRaw(editorState.getCurrentContent())));
		if (clueText === "" || clueText === "<p></p>\n") {
			setClueTextError(true);
		} else {
			setClueTextError(false);
		}
		setEditorState(editorState)
	};

	useEffect(() => {
		GameApi.getGames().then(res => {
			setGames(res.data.data);
		}).catch(err => {
			toast.error("Problem while getting games")
		})
	}, []);

	const onFileUpload = (e) => {
		console.log(e.target?.files[0]?.type);
		setFile(e.target?.files[0]);
		setFileError("");
	}

	return (
		<Formik
			initialValues={{
				name: selectedClue?.name || "",
				hint_1: selectedClue?.hint_1 || "",
				hint_2: selectedClue?.hint_2 || "",
				type: selectedClue?.type || "TEXT",
				ans: selectedClue?.ans || "",
				clue_type: selectedClue?.clue_type || "",
			}}
			validationSchema={Yup.object({
				name: Yup.string().required('Required'),
				hint_1: Yup.string().required('Required'),
				hint_2: Yup.string().required('Required'),
				type: Yup.string().required('Required'),
				ans: Yup.string().required('Required'),
				clue_type: Yup.string().required('Required'),
			})}
			onSubmit={(values, { resetForm }) => {
				setSubmited(true);

				if (values.type !== "TEXT" && file === null) {
					setFileError("File is required")
					return false;
				}

				if (values.type === "IMAGE") {
					if (file?.type === "image/png" || file?.type === "image/jpeg") {
						setFileError("");
					} else {
						setFileError("Please select image file")
						return false;
					}
				} else if (values.type === "VIDEO") {
					if (file?.type === "video/mp4") {
						setFileError("");
					} else {
						setFileError("Please select video file")
						return false;
					}
				} else if (values.type === "AUDIO") {
					if (file?.type === "audio/mpeg" || file?.type === "audio/mp3") {
						setFileError("");
					} else {
						setFileError("Please select audio file")
						return false;
					}
				} else if (values.type === "TEXT") {
					setFileError("");
				}

				if (clueText === "" || clueText === "<p></p>\n") {
					setClueTextError(true);
					return false;
				} else {
					setClueTextError(false);
				}


				let formData = new FormData();
				formData.append("name", values.name);
				formData.append("hint_1", values.hint_1);
				formData.append("hint_2", values.hint_2);
				formData.append("gameId", id);
				formData.append("clue_type", values.clue_type);
				formData.append("type", values.type);
				formData.append("text", clueText);
				formData.append("ans", values.ans);
				values.type !== "TEXT" && formData.append("file", file);

				if (selectedClue) {
					ClueApi.updateClue(selectedClue._id, formData).then(res => {
						setClues(res.data.data);
						resetForm();
						toast.success("Clue has been updated");
						setClueText("");
						setEditorState(EditorState.createEmpty());
						closeBtnRef.current.click();
					});
				} else {
					ClueApi.createClue(formData).then(res => {
						setClues(res.data.data);
						resetForm();
						toast.success("Clue has been added");
						setClueText("");
						setEditorState(EditorState.createEmpty());
						closeBtnRef.current.click();
					})
				}

			}}
			enableReinitialize={true}
		>
			{({ values }) => {
				return (
					(
						<div className="modal fade" id="addClue" tabindex="-1" aria-labelledby="addClueLabel" aria-hidden="true">
							<div className="modal-dialog modal-dialog-centered modal-lg">
								<div className="modal-content">
									<div className="modal-body">
										<button ref={closeBtnRef} type="button" className="close" data-dismiss="modal" aria-label="Close">
											<span className="icon-close"></span>
										</button>
										<h4 className="text-center">{selectedClue?.hint_1 ? "Update" : "Add"} Clue For {gameName}</h4>
										<Form>
											<div className="row">
												<div className="col-md-12">
													<div className="form-group">
														<SelectInput name="clue_type">
															<option value="">Standard/Extended</option>
															<option value={"STANDARD"}>{"STANDARD"}</option>
															<option value={"EXTENDED"}>{"EXTENDED"}</option>
														</SelectInput>
													</div>
												</div>
												<div className="col-md-12">
													<div className="form-group">
														<TextInput type="text" name="name" placeholder="Name" />
													</div>
												</div>
												<div className="col-md-12">
													<div className="form-group">
														<TextInput type="text" name="hint_1" placeholder="Hint 1" />
													</div>
												</div>
												<div className="col-md-12">
													<div className="form-group">
														<TextInput type="text" name="hint_2" placeholder="Hint 2" />
													</div>
												</div>
												<div className="col-md-12">
													<div className="form-group">
														<SelectInput name="type">
															<option value="">Type</option>
															<option value={"TEXT"}>{"TEXT"}</option>
															<option value={"IMAGE"}>{"IMAGE"}</option>
															<option value={"AUDIO"}>{"AUDIO"}</option>
															<option value={"VIDEO"}>{"VIDEO"}</option>
														</SelectInput>
													</div>
												</div>
												{values.type !== "TEXT" && (
													<div className="col-md-12">
														<div class="form-group">
															<input type="file" class="form-control" onChange={onFileUpload} />
															{submited && fileError ? (
																<span style={{ color: "red", fontSize: "0.9rem", paddingTop: "10px" }}>{fileError}</span>
															) : null}
															{selectedClue && Object.keys(selectedClue).length > 0 && selectedClue?.url && (<div style={{ marginTop: "1rem" }}><a href={selectedClue.url} target="_blank">See Attached File</a></div>)}
														</div>
													</div>
												)}
												<div className="col-md-12">
													<label for="intro" >Clue Text</label>
													<div className="form-group">
														<Editor
															editorState={editorState}
															wrapperClassName={clueTextError ? "error-demo-wrapper" : "demo-wrapper"}
															editorClassName="demo-editor"
															onEditorStateChange={onEditorStateChange}
														/>
														{clueTextError && (<span style={{ color: 'red', float: "right", marginTop: "0.6rem", marginBottom: "0.6rem" }}>Clue Text is required</span>)}
													</div>
												</div>
												<div className="col-md-12">
													<div className="form-group">
														<TextInput type="text" name="ans" placeholder="Clue Answere" />
													</div>
												</div>
											</div>
											<div className="form-group text-center mb-0 mt-3">
												<button type="submit" className="btn btn-primary">{selectedClue?.name ? "Update" : "Save"}</button>
											</div>
										</Form>
									</div>
								</div>
							</div>
						</div>
					)
				)
			}
			}
		</Formik>
	)
}

export default AddClue
