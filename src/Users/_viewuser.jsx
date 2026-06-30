import React, { useEffect } from 'react'

function Viewuser(props) {
 
    useEffect(() => {
        console.log(props.userId);
    }, [props.userId]);

    const fetchUser = async () => {
        try {
            const response = await axios.get(`http://localhost:5001/users/${props.userId}`);
            console.log(response.data);
        } catch (error) {
            console.error("Error fetching data: ", error);
        }
    }
    
  return (
    <div>
        {props.userId}
    </div>
  )
}

export default Viewuser