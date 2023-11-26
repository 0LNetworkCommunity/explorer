import { FC } from "react";
import { RouterProvider } from "react-router-dom";
import router from "./router";
// import { splitResourceName } from "./routes/Account/Resources/Resources";
// import Tree from "../ui/TreeView/Tree";
// import TreeView from "../ui/TreeView";
// import Code from "../ui/Code/Code";

const App: FC = () => {
  // const resources = [
  //   '0x1::Foo::Bar',
  // ];

  // const tree: Tree = new Tree();
  // const keys = resources.map((resource) => splitResourceName(resource));
  // for (const key of keys) {
  //   tree.insert(key);
  // }

  // return (
  //   <div 
  //     style={{
  //       height: '100vh',
  //       overflow: 'hidden'
  //     }}
  //   >
  //     <div
  //       className="bg-primary-500 flex justify-center items-center"
  //       style={{
  //         minHeight: 34,
  //       }}
  //     >
  //       <form onSubmit={(event) => event.preventDefault()}>
  //         <input
  //           type="text"
  //           placeholder="search"
  //           className="bg-primary-100 text-primary-500  "
  //           style={{
  //             height: 22,
  //             borderRadius: 6,
  //             border: "solid 1px #efefef",
  //             padding: "0 12px",
  //           }}
  //         />
  //       </form>
  //     </div>
  //     <div
  //       style={{
  //         height: 'calc(100vh - 34px)',
  //         overflow: 'scroll',
  //         display: 'flex',
  //       }}
  //     >
  //       <div className="bg-primary-200" style={{ width: 200 }}>
  //         {tree && (
  //           <TreeView tree={tree} onClick={(item) => console.log(item)} />
  //         )}
  //       </div>
  //       <div
  //         className="bg-gray-500"
  //         style={{
  //           width: '100%',
  //           maxHeight: '100%',
  //           overflowY: 'scroll',
  //         }}
  //       >
  //         <Code lang="js" plugins={["line-numbers"]}>
  //           {code}
  //         </Code>
  //       </div>
  //     </div>
  //   </div>
  // );

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
};

export default App