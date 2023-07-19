const urlParams = new URLSearchParams(window.location.search);
const Expiration_ID = urlParams.get('Expiration_ID');

if (!Expiration_ID) {
  alert('go away')
  window.location = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
}

const getAccessToken = async () => {
  const params = {
      grant_type: 'client_credentials',
      scope: 'http://www.thinkministry.com/dataplatform/scopes/all',
      client_id: client_id,
      client_secret: client_secret
  }
  const qs = Object.keys(params)
  .map(key => `${key}=${encodeURIComponent(params[key])}`)
  .join('&')

  const data = await axios({
      method: 'post',
      url: 'https://my.pureheart.org/ministryplatformapi/oauth/connect/token',
      data: qs
  })
  .then(response => response.data)
  .catch(err => console.log(err))
  return data.access_token;
}

const updateLicenseFormDOM = document.getElementById('update-license-form');
const licenseInputDOM = document.getElementById('license');
const exoDateInputDOM = document.getElementById('exp-date');
const stateInputDOM = document.getElementById('state');

let fileInput1 = document.getElementById('fileInput1');
let fileInput2 = document.getElementById('fileInput2');



updateLicenseFormDOM.addEventListener('submit', async (e) => {
  e.preventDefault();

  // update record in MP
  // --------------------------------------------------------------------------------------------------

  const updatedLicense = {
    'Expiration_ID': Expiration_ID,
    'Driver_License_#': licenseInputDOM.value,
    'License_Expiration': new Date(exoDateInputDOM.value).toISOString(),
    'State_Issuing_Authority': stateInputDOM.value
  };

  const access_token = await getAccessToken()

  await axios({
    method: 'put', //put means update
    url: 'https://my.pureheart.org/ministryplatformapi/tables/expirations', //get from swagger
    data: [updatedLicense], //always an array for put/post so you can do multiple
    headers: {
      'Content-Type': 'Application/JSON',
      'Authorization': `Bearer ${access_token}`
    }
  })
    .then(response => response.data)
    .catch(err => {
      console.error(err);
      alert('something went wrong, probably you did it wrong')
    })

  // upload license files to mp
  // --------------------------------------------------------------------------------------------------

  // Create two FileReader instances
  let reader1 = new FileReader();
  let reader2 = new FileReader();

  async function uploadFiles() {
    // Create the FormData instance
    const formData = new FormData();

    const todayString = `${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()}`
    const renamedFile1 = new File([fileInput1.files[0]], `License Front ${todayString}`, {type: fileInput1.files[0].type});
    const renamedFile2 = new File([fileInput2.files[0]], `License Back ${todayString}`, {type: fileInput2.files[0].type});

    // Append the two files
    formData.append('file1', renamedFile1);
    formData.append('file2', renamedFile2);

    // Make the axios request
    await axios({
        method: 'post',
        url: `https://my.pureheart.org/ministryplatformapi/files/expirations/${Expiration_ID}`,
        data: formData,
        headers: {
            'Authorization': `Bearer ${access_token}`
        }
    })
    .then(response => response.data)
    .catch(err => {
        console.error(err);
        alert('something went wrong, probably you did it wrong')
    });

    alert('record updated successfully')
  }

  // Define a function to be called when both files have been read
  let filesRead = 0;
  function fileRead() {
      filesRead++;
      if (filesRead === 2) {
          // Both files have been read - upload them
          uploadFiles();
      }
  }

  // Define the onload function for both readers
  reader1.onload = fileRead;
  reader2.onload = fileRead;

  // Start reading the files
  if (fileInput1.files.length > 0) {
      reader1.readAsText(fileInput1.files[0]);
  }
  if (fileInput2.files.length > 0) {
      reader2.readAsText(fileInput2.files[0]);
  }

})