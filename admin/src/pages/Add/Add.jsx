import React, { useEffect, useMemo, useRef, useState } from 'react';
import './Add.css';
import api, { errorMessage } from '../../api';
import { toast } from 'react-toastify';
import { ImageIcon, CloseIcon, ChevronDownIcon } from '../../components/Icons';
import { formatRand } from '../../utils/format';

const CATEGORIES = ["Accessories","Phones","Laptops","Smart TV","Monitor","Taplets","Office","Gaming"];

const emptyData = {
    name:"",
    description:"",
    price:"",
    category:"Accessories"
};

const Add = () => {

    const [image,setImage] = useState(false);
    const [dragging,setDragging] = useState(false);
    const [loading,setLoading] = useState(false);
    const [data,setData] = useState(emptyData);
    const inputRef = useRef(null);

    // one object URL per selected file, released when the file changes
    const preview = useMemo(()=> image ? URL.createObjectURL(image) : null,[image]);
    useEffect(()=>()=>{ if (preview) URL.revokeObjectURL(preview); },[preview]);

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData(data=>({...data,[name]:value}))
    }

    const onFileChange = (event) => {
        const file = event.target.files[0];
        if (file) setImage(file);
    }

    const clearImage = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setImage(false);
        if (inputRef.current) inputRef.current.value = "";
    }

    const onsubmitHandler = async (event) => {
        event.preventDefault();
        if (loading) return;

        const formData = new FormData();
        formData.append("name",data.name)
        formData.append("description",data.description)
        formData.append("price",Number(data.price))
        formData.append("category",data.category)
        formData.append("image",image)

        setLoading(true);
        try {
            const response = await api.post("/api/food/add",formData);
            if (response.data.success) {
                setData(emptyData)
                setImage(false)
                if (inputRef.current) inputRef.current.value = "";
                toast.success(response.data.message)
            }else{
                toast.error(response.data.message)
            }
        } catch (error) {
            toast.error(errorMessage(error))
        } finally {
            setLoading(false);
        }
    }

  return (
    <div className='add'>

        <div className="page-head">
            <div>
                <h1>Add product</h1>
                <p>Add a photo and the details shoppers will see.</p>
            </div>
        </div>

        <div className="add-layout">
            <form className="add-form card" onSubmit={onsubmitHandler}>

                <section className="add-section">
                    <h2>Photo</h2>
                    <label
                        className={`dropzone${dragging?" is-dragging":""}${preview?" has-image":""}`}
                        onDragEnter={()=>setDragging(true)}
                        onDragLeave={()=>setDragging(false)}
                        onDrop={()=>setDragging(false)}
                    >
                        <input
                            ref={inputRef}
                            className="dropzone-input"
                            onChange={onFileChange}
                            type='file'
                            id='image'
                            accept='image/*'
                            required={!image}
                        />
                        {preview ? (
                            <>
                                <img src={preview} alt="Selected product" />
                                <span className="dropzone-change">Change photo</span>
                                <button type="button" className="dropzone-clear" onClick={clearImage} aria-label="Remove photo">
                                    <CloseIcon size={16} />
                                </button>
                            </>
                        ) : (
                            <span className="dropzone-empty">
                                <span className="dropzone-icon"><ImageIcon size={28} /></span>
                                <strong>Tap to upload a photo</strong>
                                <span>or drag and drop an image here</span>
                            </span>
                        )}
                    </label>
                </section>

                <section className="add-section">
                    <h2>Details</h2>

                    <div className="field-block">
                        <label htmlFor="name">Product name</label>
                        <input className="control" id="name" onChange={onChangeHandler} value={data.name} type='text' name='name' placeholder='Type here' autoComplete="off" required />
                    </div>

                    <div className="field-block">
                        <label htmlFor="description">Description</label>
                        <textarea className="control" id="description" onChange={onChangeHandler} value={data.description} name='description' rows='5' placeholder='Write content here' required></textarea>
                    </div>

                    <div className="add-row">
                        <div className="field-block">
                            <label htmlFor="category">Category</label>
                            <div className="select-wrap">
                                <select className="control" id="category" onChange={onChangeHandler} value={data.category} name="category">
                                    {CATEGORIES.map((category)=>(
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                                <ChevronDownIcon size={18} />
                            </div>
                        </div>

                        <div className="field-block">
                            <label htmlFor="price">Price</label>
                            <div className="control-wrap">
                                <span className="price-prefix">R</span>
                                <input className="control-bare" id="price" onChange={onChangeHandler} value={data.price} type='number' inputMode="decimal" min='1' step='0.01' name='price' placeholder='200' required />
                            </div>
                        </div>
                    </div>
                </section>

                <button className="btn btn-primary add-btn" type='submit' disabled={loading}>
                    {loading && <span className="spinner" aria-hidden="true" />}
                    {loading ? "Adding..." : "Add product"}
                </button>
            </form>

            <aside className="add-preview" aria-label="Product preview">
                <p className="preview-title">Preview</p>
                <article className="preview-card card">
                    <div className="preview-media">
                        {preview ? <img src={preview} alt="" /> : <ImageIcon size={34} />}
                    </div>
                    <div className="preview-body">
                        <span className="chip">{data.category}</span>
                        <h3 className={data.name ? "" : "is-placeholder"}>{data.name || "Product name"}</h3>
                        <p className={data.description ? "" : "is-placeholder"}>{data.description || "Your description will appear here."}</p>
                        <strong>{data.price ? formatRand(data.price) : "R 0.00"}</strong>
                    </div>
                </article>
            </aside>
        </div>

    </div>
  );
}

export default Add;
