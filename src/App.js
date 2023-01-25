import {
  GetBucketCorsCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
// import { S3 } from "aws-sdk";
import Papa from "papaparse";
import { useState, useEffect } from "react";
import { useTable } from "react-table";

console.log(process.env.REACT_APP_AWS_STORAGE_BUCKET_NAME);
console.log(process.env.REACT_APP_AWS_SECRET_ACCESS_KEY);
console.log(process.env.REACT_APP_AWS_ACCESS_KEY_ID);

const App = () => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({
      columns,
      data,
    });
  const s3C = new S3Client({
    credentials: {
      accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
    },
    region: process.env.REACT_APP_AWS_S3_REGION_NAME,
  });

  const params = {
    Bucket: process.env.REACT_APP_AWS_STORAGE_BUCKET_NAME,
    Key: "constellation/custom_2018.csv",
  };

  const getCors = async () => {
    try {
      const s3Client = new S3Client({
        credentials: {
          accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
        },
        region: process.env.REACT_APP_AWS_S3_REGION_NAME,
      });
      const bucketParams = {
        Bucket: process.env.REACT_APP_AWS_STORAGE_BUCKET_NAME,
      };
      const data = await s3Client.send(new GetBucketCorsCommand(bucketParams));
      console.log("Success", JSON.stringify(data.CORSRules));
      return data; // For unit tests.
    } catch (err) {
      console.log("Error", err);
    }
  };

  const getData = async () => {
    s3C
      .send(new GetObjectCommand(params))
      .then((res) => {
        const reader = res.Body.getReader();
        reader.read().then((chunk) => {
          if (chunk.done) {
            console.log("done");
            return;
          }
          const str = new TextDecoder("utf-8").decode(chunk.value);
          Papa.parse(str, {
            header: true,
            complete: (results) => {
              // console.log(Object.keys(results.data[0]));
              setData(results.data);
              // setColumns();
              // setLoading(false);
            },
          });
        });
      })
      .catch((err) => {
        console.log("error:", err);
      });
  };
  useEffect(() => {
    getData();
    setLoading(false);
  }, []);

  return (
    <>
      <button onClick={() => getCors()}>Get Cors</button>
      {loading ? <div>Loading...</div> : null}
      {data ? (
        <table {...getTableProps()}>
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <th {...column.getHeaderProps()}>
                    {column.render("Header")}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map((row) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell) => {
                    return (
                      <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}
    </>
  );
};

export default App;
